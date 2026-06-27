package com.example.aztrvl.controller;

import com.example.aztrvl.model.HotelBooking;
import com.example.aztrvl.service.BookingService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

public class BookingControllerTest {

    @Test
    public void testGetBookingsApi() {
        BookingService bookingService = Mockito.mock(BookingService.class);
        BookingController controller = new BookingController(bookingService);

        HotelBooking mockBooking = new HotelBooking();
        mockBooking.setBookingRef("AZ-12345");
        mockBooking.setHotelId("1");
        mockBooking.setHotelName("Test Hotel");
        mockBooking.setGuestEmail("test@example.com");

        Mockito.when(bookingService.getByEmail("test@example.com"))
                .thenReturn(List.of(mockBooking));

        List<HotelBooking> result = controller.getBookingsApi("test@example.com");

        Assertions.assertNotNull(result);
        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals("AZ-12345", result.get(0).getBookingRef());
        Assertions.assertEquals("Test Hotel", result.get(0).getHotelName());
    }
}
