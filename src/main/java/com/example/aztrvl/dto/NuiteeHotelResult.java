package com.example.aztrvl.dto;

import lombok.Data;

@Data
public class NuiteeHotelResult {
    private String hotelId;
    private String name;
    private String address;
    private String mainPhoto;
    private int starRating;
    private double latitude;
    private double longitude;
    private String offerId;
    private String roomName;
    private String boardName;
    private double price;
    private String currency;
    private boolean refundable;

    public String getFormattedPrice() {
        String symbol = "INR".equals(currency) ? "₹" : (currency != null ? currency + " " : "$");
        return String.format("%s%,.0f", symbol, price);
    }

    public String getStars() {
        StringBuilder sb = new StringBuilder();
        int filled = Math.min(starRating, 5);
        for (int i = 0; i < filled; i++) sb.append("★");
        for (int i = filled; i < 5; i++) sb.append("☆");
        return sb.toString();
    }

    public boolean hasPhoto() {
        return mainPhoto != null && !mainPhoto.isBlank();
    }
}
