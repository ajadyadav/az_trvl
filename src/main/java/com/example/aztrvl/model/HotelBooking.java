package com.example.aztrvl.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hotel_bookings")
@Data
public class HotelBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String bookingRef;

    @Column(length = 200)
    private String nuiteeBookingId;

    @Column(length = 100)
    private String hotelId;

    @Column(length = 500)
    private String hotelName;

    @Column(length = 1000)
    private String hotelAddress;

    @Column(name = "check_in")
    private LocalDate checkIn;

    @Column(name = "check_out")
    private LocalDate checkOut;

    @Column(length = 200)
    private String guestFirstName;

    @Column(length = 200)
    private String guestLastName;

    @Column(length = 500)
    private String guestEmail;

    private int adults;
    private int rooms;

    private double totalPrice;

    @Column(length = 10)
    private String currency;

    @Column(length = 500)
    private String roomName;

    @Column(length = 200)
    private String boardName;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private BookingStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = BookingStatus.CONFIRMED;
        }
    }

    public String getGuestFullName() {
        return (guestFirstName != null ? guestFirstName : "") + " "
                + (guestLastName != null ? guestLastName : "");
    }

    public String getFormattedPrice() {
        String symbol = "INR".equals(currency) ? "₹" : "$";
        return String.format("%s%,.0f", symbol, totalPrice);
    }
}
