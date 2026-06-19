package com.example.aztrvl.dto;

import lombok.Data;

@Data
public class BookingRequest {
    private String offerId;
    private String hotelId;
    private String hotelName;
    private String hotelAddress;
    private String checkIn;
    private String checkOut;
    private String firstName;
    private String lastName;
    private String email;
    private double price;
    private String currency;
    private String roomName;
    private String boardName;
    private int adults;
    private int rooms;
}
