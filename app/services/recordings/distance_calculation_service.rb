module Recordings
  class DistanceCalculationService
    def initialize(recording)
      @recording = recording
    end

    def calculate
      total_distance = 0
      previous_location = nil

      @recording.recorded_locations.order(:recorded_at).find_each(batch_size: 100) do |location|
        if previous_location
          distance = Gps::DistanceCalculator.distance_in_meters(
            previous_location.adjusted_latitude,
            previous_location.adjusted_longitude,
            location.adjusted_latitude,
            location.adjusted_longitude
          )
          total_distance += distance
        end
        previous_location = location
      end

      nautical_miles = total_distance / 1852.0
      nautical_miles.round(2)
    end
  end
end
