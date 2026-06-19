package com.example.aztrvl.controller;

import com.example.aztrvl.dto.HotelRoomRate;
import com.example.aztrvl.dto.HotelSearchRequest;
import com.example.aztrvl.dto.NuiteeHotelResult;
import com.example.aztrvl.service.NuiteeApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class HotelSearchController {

    private final NuiteeApiService nuiteeApiService;

    // --------------------------------------------------------
    // POST /search/hotels — main hotel search form submission
    // --------------------------------------------------------
    @PostMapping("/search/hotels")
    public String searchHotels(
            @RequestParam("city") String city,
            @RequestParam(value = "countryCode", defaultValue = "IN") String countryCode,
            @RequestParam("checkIn") String checkIn,
            @RequestParam("checkOut") String checkOut,
            @RequestParam(value = "adults", defaultValue = "2") int adults,
            @RequestParam(value = "rooms", defaultValue = "1") int rooms,
            @RequestParam(value = "guestNationality", defaultValue = "IN") String guestNationality,
            Model model) {

        HotelSearchRequest request = new HotelSearchRequest();
        request.setCityName(city);
        request.setCountryCode(countryCode);
        request.setCheckIn(checkIn);
        request.setCheckOut(checkOut);
        request.setAdults(adults);
        request.setRooms(rooms);
        request.setGuestNationality(guestNationality);
        request.setCurrency("INR");

        List<NuiteeHotelResult> hotels = nuiteeApiService.searchHotels(request);
        log.info("Hotel search returned {} results for city={}", hotels.size(), city);

        model.addAttribute("hotels", hotels);
        model.addAttribute("city", city);
        model.addAttribute("countryCode", countryCode);
        model.addAttribute("checkIn", checkIn);
        model.addAttribute("checkOut", checkOut);
        model.addAttribute("adults", adults);
        model.addAttribute("rooms", rooms);
        model.addAttribute("totalResults", hotels.size());

        return "search_results_hotels";
    }

    // --------------------------------------------------------
    // GET /hotels/{hotelId} — hotel detail page with all room types
    // --------------------------------------------------------
    @GetMapping("/hotels/{hotelId}")
    public String hotelDetail(
            @PathVariable String hotelId,
            @RequestParam String hotelName,
            @RequestParam(defaultValue = "") String hotelAddress,
            @RequestParam(defaultValue = "") String mainPhoto,
            @RequestParam(defaultValue = "0") int starRating,
            @RequestParam String checkIn,
            @RequestParam String checkOut,
            @RequestParam(defaultValue = "2") int adults,
            @RequestParam(defaultValue = "1") int rooms,
            @RequestParam(defaultValue = "") String city,
            @RequestParam(defaultValue = "IN") String countryCode,
            Model model) {

        List<HotelRoomRate> rates = nuiteeApiService.getHotelRates(
                hotelId, checkIn, checkOut, adults, rooms, "INR");

        log.info("Hotel detail: hotelId={}, rates found={}", hotelId, rates.size());

        model.addAttribute("hotelId", hotelId);
        model.addAttribute("hotelName", hotelName);
        model.addAttribute("hotelAddress", hotelAddress);
        model.addAttribute("mainPhoto", mainPhoto);
        model.addAttribute("starRating", starRating);
        model.addAttribute("checkIn", checkIn);
        model.addAttribute("checkOut", checkOut);
        model.addAttribute("adults", adults);
        model.addAttribute("rooms", rooms);
        model.addAttribute("city", city);
        model.addAttribute("countryCode", countryCode);
        model.addAttribute("rates", rates);

        // Build stars string
        StringBuilder stars = new StringBuilder();
        int filled = Math.min(starRating, 5);
        for (int i = 0; i < filled; i++) stars.append("★");
        for (int i = filled; i < 5; i++) stars.append("☆");
        model.addAttribute("starsDisplay", stars.toString());

        return "hotel_detail";
    }

    // --------------------------------------------------------
    // GET /api/locations — city autocomplete JSON endpoint
    // --------------------------------------------------------
    @GetMapping("/api/locations")
    @ResponseBody
    public List<Map<String, String>> suggestLocations(
            @RequestParam(value = "q", defaultValue = "") String query,
            @RequestParam(value = "countryCode", defaultValue = "IN") String countryCode) {

        return nuiteeApiService.searchCities(countryCode, query);
    }
}
