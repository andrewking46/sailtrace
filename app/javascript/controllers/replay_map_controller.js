import { Controller } from "@hotwired/stimulus";
import L from "leaflet";

export default class extends Controller {
  static targets = ["slider", "timeDisplay"];
  static values = { recordingId: Number, startTime: String, boatColor: String };

  connect() {
    this.initializeReplayMap();
  }

  initializeReplayMap() {
    this.map = L.map(this.element, {
      center: [0, 0],
      zoom: 13,
      zoomControl: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: false,
      keyboard: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      noWrap: true
    }).addTo(this.map);

    this.fetchAndDisplayPath();
  }

  fetchAndDisplayPath() {
    fetch(`/recordings/${this.recordingIdValue}/recorded_locations.json`)
      .then(response => response.json())
      .then(data => {
        this.locations = data;
        this.updateSliderRange();
        this.drawPathUpToPoint(this.locations.length - 1);
      })
      .catch(error => console.log(error));
  }

  updateSliderRange() {
    this.sliderTarget.max = this.locations.length - 1;
    this.sliderTarget.value = this.sliderTarget.max;
    this.sliderTarget.disabled = false;
  }

  drawPathUpToPoint(index) {
    this.map.eachLayer(layer => {
      if (!(layer instanceof L.TileLayer)) {
        this.map.removeLayer(layer);
      }
    });

    for (let i = 1; i <= index; i++) { // Start from 1 since we need a previous point
      const previousLocation = this.locations[i - 1];
      const currentLocation = this.locations[i];
      const color = this.getSegmentColor(previousLocation, currentLocation);

      L.polyline([
        [previousLocation.latitude, previousLocation.longitude],
        [currentLocation.latitude, currentLocation.longitude]
      ], { color, weight: 3 }).addTo(this.map);
    }

    const currentPosition = this.locations[index];
    L.circleMarker([currentPosition.latitude, currentPosition.longitude], {
      radius: 4,
      color: this.boatColorValue
    }).addTo(this.map);

    this.map.fitBounds(L.polyline(this.locations.map(loc => [loc.latitude, loc.longitude])).getBounds());

    this.updateTimeDisplay(index);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }

  getSegmentColor(previousLocation, currentLocation) {
    const distance = this.calculateDistance(
      previousLocation.latitude, previousLocation.longitude,
      currentLocation.latitude, currentLocation.longitude
    ); // Distance in meters

    const timeElapsed = (new Date(currentLocation.created_at) - new Date(previousLocation.created_at)) / 1000; // Time in seconds

    const speed = distance / timeElapsed; // Speed in meters per second

    if (speed > 1) return 'green'; // Adjust these thresholds as needed
    if (speed > 0.5) return 'yellow';
    return 'orange';
  }

  updateTimeDisplay(index) {
    const startTime = new Date(this.startTimeValue);
    const currentPosition = this.locations[index];
    const currentTime = new Date(currentPosition.created_at);
    this.timeDisplayTarget.textContent = this.formatTime(currentTime - startTime);
  }

  formatTime(milliseconds) {
    let totalSeconds = Math.floor(milliseconds / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map(val => val.toString().padStart(2, '0')).join(':');
  }

  sliderValueChanged(event) {
    const index = parseInt(event.target.value, 10);
    this.drawPathUpToPoint(index);
  }
}

