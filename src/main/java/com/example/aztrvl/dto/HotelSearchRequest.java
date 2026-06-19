package com.example.aztrvl.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class HotelSearchRequest {
    private String cityName;
    private String countryCode = "IN";
    private String checkIn;
    private String checkOut;
    private int adults = 2;
    private int rooms = 1;
    private List<Integer> childrenAges = new ArrayList<>();
    private String currency = "INR";
    private String guestNationality = "IN";
}
