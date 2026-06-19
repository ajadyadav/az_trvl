package com.example.aztrvl.repository;

import com.example.aztrvl.model.HotelBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HotelBookingRepository extends JpaRepository<HotelBooking, Long> {
    List<HotelBooking> findByGuestEmailOrderByCreatedAtDesc(String email);
    Optional<HotelBooking> findByBookingRef(String bookingRef);
}
