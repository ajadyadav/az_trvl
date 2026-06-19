package com.example.aztrvl.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.ui.Model;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/auth")
    public String auth() {
        return "auth";
    }

    @GetMapping("/profile")
    public String profile() {
        return "profile";
    }

    @PostMapping("/search/flights")
    public String searchFlights(
            @RequestParam("tripType") String tripType,
            @RequestParam("from") String from,
            @RequestParam("to") String to,
            @RequestParam("departure") String departure,
            @RequestParam(value = "returnDate", required = false) String returnDate,
            @RequestParam("travellers") String travellers,
            @RequestParam("classType") String classType,
            @RequestParam(value = "fareType", required = false) String fareType,
            Model model) {

        model.addAttribute("tripType", tripType);
        model.addAttribute("from", from);
        model.addAttribute("to", to);
        model.addAttribute("departure", departure);
        model.addAttribute("returnDate", returnDate);
        model.addAttribute("travellers", travellers);
        model.addAttribute("classType", classType);
        model.addAttribute("fareType", fareType);

        return "search_results_flights";
    }
}

