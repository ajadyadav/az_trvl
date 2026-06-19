package com.example.aztrvl.service;

import com.example.aztrvl.dto.HotelRoomRate;
import com.example.aztrvl.dto.HotelSearchRequest;
import com.example.aztrvl.dto.NuiteeHotelResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NuiteeApiService {

    @Value("${nuitee.api.key}")
    private String apiKey;

    @Value("${nuitee.api.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Simple in-memory cache: countryCode -> full city list
    private final Map<String, List<Map<String, String>>> citiesCache = new ConcurrentHashMap<>();

    // --------------------------------------------------------
    // Build common request headers
    // --------------------------------------------------------
    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        return headers;
    }

    // --------------------------------------------------------
    // Search Hotels (POST /hotels/rates)
    // --------------------------------------------------------
    public List<NuiteeHotelResult> searchHotels(HotelSearchRequest req) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("checkin", req.getCheckIn());
            body.put("checkout", req.getCheckOut());
            body.put("currency", req.getCurrency());
            body.put("guestNationality", req.getGuestNationality());

            Map<String, Object> occupancy = new HashMap<>();
            occupancy.put("adults", req.getAdults());
            occupancy.put("children", req.getChildrenAges() != null ? req.getChildrenAges() : List.of());
            body.put("occupancies", List.of(occupancy));

            body.put("cityName", req.getCityName());
            body.put("countryCode", req.getCountryCode());
            body.put("limit", 20);
            body.put("timeout", 20);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, buildHeaders());
            log.info("Searching hotels: city={}, country={}, checkIn={}, checkOut={}",
                    req.getCityName(), req.getCountryCode(), req.getCheckIn(), req.getCheckOut());

            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/hotels/rates",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            return parseHotelRates(response.getBody());

        } catch (Exception e) {
            log.error("Error searching hotels via Nuitee API: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private List<NuiteeHotelResult> parseHotelRates(String json) {
        List<NuiteeHotelResult> results = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode dataNode = root.path("data");
            JsonNode hotelsNode = root.path("hotels");

            if (!dataNode.isArray() || !hotelsNode.isArray()) {
                return results;
            }

            // Map to store cheapest rate info for each hotelId
            Map<String, NuiteeHotelResult> cheapestRatesMap = new HashMap<>();

            for (JsonNode hotelRatesNode : dataNode) {
                String hotelId = hotelRatesNode.path("hotelId").asText("");
                if (hotelId.isEmpty()) continue;

                JsonNode roomTypes = hotelRatesNode.path("roomTypes");
                if (!roomTypes.isArray()) continue;

                double cheapestPrice = Double.MAX_VALUE;
                NuiteeHotelResult cheapestResult = null;

                for (JsonNode roomType : roomTypes) {
                    String offerId = roomType.path("offerId").asText("");
                    JsonNode rates = roomType.path("rates");
                    if (!rates.isArray()) continue;

                    for (JsonNode rate : rates) {
                        double price = 0;
                        String currency = "INR";
                        JsonNode total = rate.path("retailRate").path("total");
                        if (total.isArray() && !total.isEmpty()) {
                            price = total.get(0).path("amount").asDouble(0);
                            currency = total.get(0).path("currency").asText("INR");
                        }

                        if (price > 0 && price < cheapestPrice) {
                            cheapestPrice = price;
                            
                            cheapestResult = new NuiteeHotelResult();
                            cheapestResult.setHotelId(hotelId);
                            cheapestResult.setOfferId(offerId);
                            cheapestResult.setRoomName(rate.path("name").asText("Standard Room"));
                            cheapestResult.setBoardName(rate.path("boardName").asText("Room Only"));
                            
                            String refTag = rate.path("cancellationPolicies").path("refundableTag").asText("");
                            cheapestResult.setRefundable("RFN".equalsIgnoreCase(refTag));
                            cheapestResult.setPrice(price);
                            cheapestResult.setCurrency(currency);
                        }
                    }
                }

                if (cheapestResult != null) {
                    cheapestRatesMap.put(hotelId, cheapestResult);
                }
            }

            // Combine with hotel metadata
            for (JsonNode hotelMeta : hotelsNode) {
                String id = hotelMeta.path("id").asText("");
                if (id.isEmpty()) continue;

                NuiteeHotelResult rateInfo = cheapestRatesMap.get(id);
                if (rateInfo != null) {
                    rateInfo.setName(hotelMeta.path("name").asText("Unknown Hotel"));
                    rateInfo.setAddress(hotelMeta.path("address").asText(""));
                    rateInfo.setMainPhoto(hotelMeta.path("main_photo").asText(""));
                    rateInfo.setStarRating(hotelMeta.path("stars").asInt(0));
                    rateInfo.setLatitude(hotelMeta.path("latitude").asDouble(0));
                    rateInfo.setLongitude(hotelMeta.path("longitude").asDouble(0));
                    results.add(rateInfo);
                }
            }

        } catch (Exception e) {
            log.error("Error parsing hotel rates response: {}", e.getMessage(), e);
        }
        return results;
    }

    // --------------------------------------------------------
    // Prebook (POST /rates/prebook)
    // --------------------------------------------------------
    public String prebookOffer(String offerId) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("offerId", offerId);
            body.put("usePaymentSdk", false);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, buildHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/rates/prebook",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String prebookId = root.path("data").path("prebookId").asText("");
            log.info("Prebook successful, prebookId={}", prebookId);
            return prebookId;

        } catch (Exception e) {
            log.error("Error during prebook: {}", e.getMessage(), e);
            return null;
        }
    }

    // --------------------------------------------------------
    // Complete Booking (POST /rates/book) — sandbox ACC_CREDIT_CARD
    // --------------------------------------------------------
    public String completeBooking(String prebookId, String firstName, String lastName, String email) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("prebookId", prebookId);

            Map<String, String> guestInfo = new HashMap<>();
            guestInfo.put("guestFirstName", firstName);
            guestInfo.put("guestLastName", lastName);
            guestInfo.put("guestEmail", email);
            body.put("guestInfo", guestInfo);

            Map<String, String> payment = new HashMap<>();
            payment.put("method", "ACC_CREDIT_CARD");
            body.put("payment", payment);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, buildHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/rates/book",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String bookingId = root.path("data").path("bookingId").asText("");
            log.info("Booking complete, nuiteeBookingId={}", bookingId);
            return bookingId;

        } catch (Exception e) {
            log.error("Error completing booking: {}", e.getMessage(), e);
            return null;
        }
    }

    // --------------------------------------------------------
    // Get all room rates for a single hotel (hotel detail page)
    // --------------------------------------------------------
    public List<HotelRoomRate> getHotelRates(String hotelId, String checkIn, String checkOut,
                                              int adults, int rooms, String currency) {
        List<HotelRoomRate> result = new ArrayList<>();
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("checkin", checkIn);
            body.put("checkout", checkOut);
            body.put("currency", currency);
            body.put("guestNationality", "IN");

            Map<String, Object> occupancy = new HashMap<>();
            occupancy.put("adults", adults);
            occupancy.put("children", List.of());
            body.put("occupancies", List.of(occupancy));

            body.put("hotelIds", List.of(hotelId));
            body.put("limit", 20);
            body.put("timeout", 20);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, buildHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/hotels/rates",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode dataNode = root.path("data");
            if (dataNode.isArray() && !dataNode.isEmpty()) {
                JsonNode hotelRatesNode = dataNode.get(0);
                JsonNode roomTypes = hotelRatesNode.path("roomTypes");
                if (roomTypes.isArray()) {
                    for (JsonNode roomType : roomTypes) {
                        String offerId = roomType.path("offerId").asText("");
                        JsonNode rates = roomType.path("rates");
                        if (rates.isArray()) {
                            for (JsonNode rate : rates) {
                                HotelRoomRate r = new HotelRoomRate();
                                r.setOfferId(offerId);
                                r.setRoomName(rate.path("name").asText("Standard Room"));
                                r.setBoardName(rate.path("boardName").asText("Room Only"));
                                
                                String refTag = rate.path("cancellationPolicies").path("refundableTag").asText("");
                                r.setRefundable("RFN".equalsIgnoreCase(refTag));

                                JsonNode total = rate.path("retailRate").path("total");
                                if (total.isArray() && !total.isEmpty()) {
                                    r.setPrice(total.get(0).path("amount").asDouble(0));
                                    r.setCurrency(total.get(0).path("currency").asText(currency));
                                }

                                if (r.isRefundable()) {
                                    r.setCancellationPolicy("Free cancellation");
                                } else {
                                    r.setCancellationPolicy("Non-refundable");
                                }

                                if (!r.getOfferId().isBlank()) {
                                    result.add(r);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching hotel rates for hotelId={}: {}", hotelId, e.getMessage(), e);
        }
        return result;
    }


    // City Autocomplete (GET /data/cities?countryCode=...)
    // --------------------------------------------------------
    public List<Map<String, String>> searchCities(String countryCode, String keyword) {
        // Use cached city list per country, fetching once on first call
        if (!citiesCache.containsKey(countryCode)) {
            citiesCache.put(countryCode, fetchAllCities(countryCode));
        }

        List<Map<String, String>> all = citiesCache.get(countryCode);
        if (all.isEmpty()) return all;

        if (keyword == null || keyword.isBlank()) {
            return all.subList(0, Math.min(8, all.size()));
        }

        String lowerKw = keyword.toLowerCase().trim();
        return all.stream()
                .filter(c -> c.getOrDefault("city", "").toLowerCase().contains(lowerKw))
                .limit(10)
                .collect(Collectors.toList());
    }

    private List<Map<String, String>> fetchAllCities(String countryCode) {
        try {
            String url = baseUrl + "/data/cities?countryCode=" + countryCode;
            HttpEntity<Void> entity = new HttpEntity<>(buildHeaders());
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode data = root.path("data");

            List<Map<String, String>> cities = new ArrayList<>();
            if (data.isArray()) {
                for (JsonNode node : data) {
                    String cityName = node.path("city").asText(
                            node.path("name").asText(""));
                    if (!cityName.isBlank()) {
                        Map<String, String> city = new HashMap<>();
                        city.put("city", cityName);
                        city.put("country", node.path("country").asText(""));
                        city.put("countryCode", node.path("countryCode").asText(countryCode));
                        cities.add(city);
                    }
                }
            }
            log.info("Cached {} cities for countryCode={}", cities.size(), countryCode);
            return cities;
        } catch (Exception e) {
            log.error("Error fetching cities for countryCode={}: {}", countryCode, e.getMessage());
            return Collections.emptyList();
        }
    }
}
