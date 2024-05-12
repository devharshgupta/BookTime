
--  Statement to create calender table
CREATE TABLE calendar (
    calendarDate DATE PRIMARY KEY,
    calendarDay ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
    INDEX idx_calendar_day (calendarDay)
);

-- Procedure To Generate calender Table
DELIMITER //

CREATE PROCEDURE InsertDatesInCalendar(IN startDate DATE, IN endDate DATE)
BEGIN
    DECLARE currentDate DATE;
    SET currentDate = startDate;

    WHILE currentDate <= endDate DO
        INSERT INTO calendar (calendarDate, calendarDay)
        VALUES (currentDate, UPPER(DATE_FORMAT(currentDate, '%W')));

        SET currentDate = DATE_ADD(currentDate, INTERVAL 1 DAY);
    END WHILE;
END //

DELIMITER ;


-- Statement to call procedure
CALL InsertDatesInCalendar('2024-01-01', '2029-12-31');