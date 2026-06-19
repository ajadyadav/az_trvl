package com.example.aztrvl.dto;

import lombok.Data;

@Data
public class HotelRoomRate {
    private String offerId;
    private String roomName;
    private String boardName;
    private String bedType;
    private double price;
    private String currency;
    private boolean refundable;
    private String cancellationPolicy;
    private int maxOccupancy;

    public String getFormattedPrice() {
        String symbol = "INR".equals(currency) ? "₹" : (currency != null ? currency + " " : "$");
        return String.format("%s%,.0f", symbol, price);
    }

    public String getBoardIcon() {
        if (boardName == null) return "fa-utensils";
        String b = boardName.toLowerCase();
        if (b.contains("breakfast")) return "fa-mug-hot";
        if (b.contains("all inclusive") || b.contains("all-inclusive")) return "fa-bowl-food";
        if (b.contains("half") || b.contains("hb")) return "fa-drumstick-bite";
        if (b.contains("full") || b.contains("fb")) return "fa-plate-wheat";
        return "fa-ban";
    }
}
