package com.example.aztrvl.service;

import com.example.aztrvl.dto.BookingRequest;
import com.example.aztrvl.model.BookingStatus;
import com.example.aztrvl.model.HotelBooking;
import com.example.aztrvl.repository.HotelBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final HotelBookingRepository repository;
    private final NuiteeApiService nuiteeApiService;

    // --------------------------------------------------------
    // Create a new booking: prebook → book → save locally
    // --------------------------------------------------------
    public HotelBooking createBooking(BookingRequest req) {
        String nuiteeBookingId = null;
        BookingStatus status = BookingStatus.CONFIRMED;

        try {
            // Step 1: Prebook with Nuitee (validates offer still available)
            String prebookId = nuiteeApiService.prebookOffer(req.getOfferId());

            if (prebookId != null && !prebookId.isBlank()) {
                // Step 2: Complete booking with sandbox ACC_CREDIT_CARD payment
                nuiteeBookingId = nuiteeApiService.completeBooking(
                        prebookId,
                        req.getFirstName(),
                        req.getLastName(),
                        req.getEmail()
                );

                if (nuiteeBookingId == null || nuiteeBookingId.isBlank()) {
                    log.warn("Nuitee book returned empty ID — saving as PENDING");
                    status = BookingStatus.PENDING;
                }
            } else {
                log.warn("Nuitee prebook returned empty ID — saving as PENDING");
                status = BookingStatus.PENDING;
            }
        } catch (Exception e) {
            log.error("Exception during Nuitee booking flow: {}", e.getMessage(), e);
            status = BookingStatus.PENDING;
        }

        // Step 3: Always persist locally regardless of Nuitee result
        return persistBooking(req, nuiteeBookingId, status);
    }

    private HotelBooking persistBooking(BookingRequest req, String nuiteeBookingId, BookingStatus status) {
        try {
            HotelBooking booking = new HotelBooking();
            booking.setBookingRef("AZ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            booking.setNuiteeBookingId(nuiteeBookingId);
            booking.setHotelId(req.getHotelId());
            booking.setHotelName(req.getHotelName());
            booking.setHotelAddress(req.getHotelAddress());
            booking.setCheckIn(LocalDate.parse(req.getCheckIn()));
            booking.setCheckOut(LocalDate.parse(req.getCheckOut()));
            booking.setGuestFirstName(req.getFirstName());
            booking.setGuestLastName(req.getLastName());
            booking.setGuestEmail(req.getEmail());
            booking.setAdults(req.getAdults());
            booking.setRooms(req.getRooms() > 0 ? req.getRooms() : 1);
            booking.setTotalPrice(req.getPrice());
            booking.setCurrency(req.getCurrency() != null ? req.getCurrency() : "INR");
            booking.setRoomName(req.getRoomName());
            booking.setBoardName(req.getBoardName());
            booking.setStatus(status);

            HotelBooking saved = repository.save(booking);
            log.info("Booking saved: ref={}, status={}, nuiteeId={}", saved.getBookingRef(), status, nuiteeBookingId);
            return saved;
        } catch (Exception e) {
            log.error("Failed to persist booking: {}", e.getMessage(), e);
            return null;
        }
    }

    // --------------------------------------------------------
    // Lookups
    // --------------------------------------------------------
    public HotelBooking getByRef(String ref) {
        return repository.findByBookingRef(ref).orElse(null);
    }

    public List<HotelBooking> getByEmail(String email) {
        if (email == null || email.isBlank()) return List.of();
        return repository.findByGuestEmailOrderByCreatedAtDesc(email);
    }
}
