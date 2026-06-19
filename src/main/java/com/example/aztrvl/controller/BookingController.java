package com.example.aztrvl.controller;

import com.example.aztrvl.dto.BookingRequest;
import com.example.aztrvl.model.HotelBooking;
import com.example.aztrvl.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Slf4j
public class BookingController {

    private final BookingService bookingService;

    // --------------------------------------------------------
    // GET /hotels/book — show booking form
    // --------------------------------------------------------
    @GetMapping("/hotels/book")
    public String showBookingForm(
            @RequestParam String offerId,
            @RequestParam String hotelId,
            @RequestParam String hotelName,
            @RequestParam(defaultValue = "") String hotelAddress,
            @RequestParam String checkIn,
            @RequestParam String checkOut,
            @RequestParam double price,
            @RequestParam(defaultValue = "INR") String currency,
            @RequestParam(defaultValue = "Standard Room") String roomName,
            @RequestParam(defaultValue = "Room Only") String boardName,
            @RequestParam(defaultValue = "2") int adults,
            @RequestParam(defaultValue = "1") int rooms,
            @RequestParam(defaultValue = "") String photoUrl,
            Model model) {

        model.addAttribute("offerId", offerId);
        model.addAttribute("hotelId", hotelId);
        model.addAttribute("hotelName", hotelName);
        model.addAttribute("hotelAddress", hotelAddress);
        model.addAttribute("checkIn", checkIn);
        model.addAttribute("checkOut", checkOut);
        model.addAttribute("price", price);
        model.addAttribute("currency", currency);
        model.addAttribute("roomName", roomName);
        model.addAttribute("boardName", boardName);
        model.addAttribute("adults", adults);
        model.addAttribute("rooms", rooms);
        model.addAttribute("photoUrl", photoUrl);

        // Format price for display
        String priceSymbol = "INR".equals(currency) ? "₹" : currency + " ";
        model.addAttribute("formattedPrice", String.format("%s%,.0f", priceSymbol, price));

        return "hotel_booking";
    }

    // --------------------------------------------------------
    // POST /hotels/confirm — process booking form submission
    // --------------------------------------------------------
    @PostMapping("/hotels/confirm")
    public String confirmBooking(@ModelAttribute BookingRequest request, Model model) {
        log.info("Processing booking: hotel={}, guest={} {}, email={}",
                request.getHotelName(), request.getFirstName(), request.getLastName(), request.getEmail());

        HotelBooking booking = bookingService.createBooking(request);

        if (booking != null && booking.getBookingRef() != null) {
            return "redirect:/booking/confirmation/" + booking.getBookingRef();
        }

        model.addAttribute("error", "Booking could not be completed. Please try again.");
        model.addAttribute("offerId", request.getOfferId());
        model.addAttribute("hotelId", request.getHotelId());
        model.addAttribute("hotelName", request.getHotelName());
        model.addAttribute("hotelAddress", request.getHotelAddress());
        model.addAttribute("checkIn", request.getCheckIn());
        model.addAttribute("checkOut", request.getCheckOut());
        model.addAttribute("price", request.getPrice());
        model.addAttribute("currency", request.getCurrency());
        model.addAttribute("roomName", request.getRoomName());
        model.addAttribute("boardName", request.getBoardName());
        model.addAttribute("adults", request.getAdults());
        model.addAttribute("rooms", request.getRooms());
        String priceSymbol = "INR".equals(request.getCurrency()) ? "₹" : request.getCurrency() + " ";
        model.addAttribute("formattedPrice", String.format("%s%,.0f", priceSymbol, request.getPrice()));
        return "hotel_booking";
    }

    // --------------------------------------------------------
    // GET /booking/confirmation/{ref} — booking confirmation page
    // --------------------------------------------------------
    @GetMapping("/booking/confirmation/{ref}")
    public String bookingConfirmation(@PathVariable String ref, Model model) {
        HotelBooking booking = bookingService.getByRef(ref);

        if (booking == null) {
            return "redirect:/";
        }

        model.addAttribute("booking", booking);
        return "booking_confirmation";
    }

    // --------------------------------------------------------
    // GET /my-bookings — list bookings by email
    // --------------------------------------------------------
    @GetMapping("/my-bookings")
    public String myBookings(
            @RequestParam(required = false, defaultValue = "") String email,
            Model model) {

        List<HotelBooking> bookings = bookingService.getByEmail(email);
        model.addAttribute("bookings", bookings);
        model.addAttribute("email", email);
        return "my_bookings";
    }
}
