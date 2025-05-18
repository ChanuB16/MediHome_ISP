import { useState, useEffect, useRef } from 'react';
import { FiMapPin } from 'react-icons/fi';

const LocationPicker = ({ onLocationSelect }) => {
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const mapRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
        link.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
        script.integrity = 'sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA==';
        script.crossOrigin = '';
        script.onload = initMap;
        document.body.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.body.removeChild(script);
        };
    }, []);

    const initMap = () => {
        if (!window.L || !mapRef.current) return;

        // Initialize map centered on Sri Lanka
        const mapInstance = window.L.map(mapRef.current).setView([7.8731, 80.7718], 8);
        
        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstance);

        // Create a marker
        const markerInstance = window.L.marker([7.8731, 80.7718], {
            draggable: true
        }).addTo(mapInstance);

        // Handle marker drag end
        markerInstance.on('dragend', function() {
            const position = markerInstance.getLatLng();
            reverseGeocode(position.lat, position.lng);
        });

        // Handle map click
        mapInstance.on('click', function(e) {
            markerInstance.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        setMap(mapInstance);
        setMarker(markerInstance);
    };

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.display_name) {
                const address = data.display_name;
                setSelectedLocation(address);
                onLocationSelect(address);
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=lk&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const latLng = [parseFloat(lat), parseFloat(lon)];
                
                map.setView(latLng, 15);
                marker.setLatLng(latLng);
                setSelectedLocation(display_name);
                onLocationSelect(display_name);
            }
        } catch (error) {
            console.error('Error searching location:', error);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex">
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a location in Sri Lanka"
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Search
                </button>
            </form>

            <div
                ref={mapRef}
                className="w-full h-64 rounded-lg border border-gray-600"
            />

            {selectedLocation && (
                <div className="flex items-center p-3 bg-gray-700 rounded-lg">
                    <FiMapPin className="text-blue-400 mr-2" />
                    <span className="text-white text-sm">{selectedLocation}</span>
                </div>
            )}

            <p className="text-gray-400 text-sm">
                Click on the map or drag the marker to select your location. You can also search for a location.
            </p>
        </div>
    );
};

export default LocationPicker; 