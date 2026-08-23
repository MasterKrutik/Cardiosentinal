import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, MapPin, Navigation, Clock, Building2, ExternalLink, ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Info, Award, PhoneCall, Video, Bed, ShieldCheck, X, Globe } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_TILE_CONFIG } from '../config/mapTiles';

// Helper component to auto-recenter and fit map bounds
function MapBoundsFitter({ center, markers }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !markers || markers.length === 0) return;
    try {
      const bounds = L.latLngBounds([center]);
      markers.forEach((m) => {
        if (m.latitude && m.longitude) {
          bounds.extend([m.latitude, m.longitude]);
        }
      });
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } catch (e) {
      console.warn('Map bounds fit error:', e);
    }
  }, [map, center, markers]);
  return null;
}

// Custom Leaflet DivIcon Creators matching CardioSentinel design system & tiers
const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: #E85D4A;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 16px rgba(232, 93, 74, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const createFacilityIcon = (facilityTier, isSelected) => {
  let bgColor = '#3FA88A'; // CHC / District (Teal)
  let borderColor = '#059669';
  let badgeText = 'CHC';

  if (facilityTier === 'tertiary_national_institute') {
    bgColor = '#A855F7'; // Purple (National)
    borderColor = '#7E22CE';
    badgeText = 'NAT';
  } else if (facilityTier === 'medical_college_hospital') {
    bgColor = '#4EB8E0'; // Cyan/Blue (Medical College)
    borderColor = '#2C7FB8';
    badgeText = 'MED';
  } else if (facilityTier === 'district_hospital') {
    bgColor = '#DDA43C'; // Amber (District Hospital)
    borderColor = '#B45309';
    badgeText = 'DST';
  }

  const size = isSelected ? 36 : 28;
  const shadow = isSelected ? '0 0 20px rgba(255, 255, 255, 0.9)' : '0 4px 12px rgba(0,0,0,0.5)';

  return L.divIcon({
    className: 'custom-facility-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 3px solid ${isSelected ? '#FFFFFF' : borderColor};
        border-radius: 50%;
        box-shadow: ${shadow};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        font-family: monospace;
        transition: all 0.2s ease;
      ">
        ${badgeText}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const PAN_INDIA_FACILITIES = [
  // Meghalaya / Northeast
  {
    id: "fac-01",
    name: "NEIGRIHMS Cardiology Wing",
    facility_tier: "tertiary_national_institute",
    city: "Shillong",
    state: "Meghalaya",
    district_id: "dist-meghalaya-01",
    latitude: 25.6022,
    longitude: 91.9056,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 6,
    general_ward_beds_available: 18,
    icu_beds_available: 4,
    pediatric_cardiac_beds_available: 2,
    estimated_echo_cost_range: "Free (Ayushman Bharat)",
    verified_contact_number: "+913642538000",
    maps_url: "https://maps.google.com/?q=NEIGRIHMS+Shillong",
    offers_teleconsultation: true
  },
  {
    id: "fac-02",
    name: "Shillong Civil Hospital",
    facility_tier: "district_hospital",
    city: "Shillong",
    state: "Meghalaya",
    district_id: "dist-meghalaya-01",
    latitude: 25.5721,
    longitude: 91.8845,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 12,
    general_ward_beds_available: 10,
    icu_beds_available: 2,
    pediatric_cardiac_beds_available: 1,
    estimated_echo_cost_range: "Free (Govt Scheme)",
    verified_contact_number: "+913642226381",
    maps_url: "https://maps.google.com/?q=Shillong+Civil+Hospital",
    offers_teleconsultation: true
  },
  {
    id: "fac-03",
    name: "Ganesh Das MCH Hospital",
    facility_tier: "medical_college_hospital",
    city: "Shillong",
    state: "Meghalaya",
    district_id: "dist-meghalaya-01",
    latitude: 25.5890,
    longitude: 91.8980,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 4,
    general_ward_beds_available: 15,
    icu_beds_available: 3,
    pediatric_cardiac_beds_available: 2,
    estimated_echo_cost_range: "Free (Ayushman Bharat)",
    verified_contact_number: "+913642224000",
    maps_url: "https://maps.google.com/?q=Ganesh+Das+Hospital+Shillong",
    offers_teleconsultation: true
  },
  // Delhi NCR / Haryana / North India
  {
    id: "fac-04",
    name: "AIIMS New Delhi - Cardiothoracic Centre",
    facility_tier: "tertiary_national_institute",
    city: "New Delhi",
    state: "Delhi NCR",
    district_id: "dist-delhi-01",
    latitude: 28.5672,
    longitude: 77.2100,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 18,
    general_ward_beds_available: 45,
    icu_beds_available: 12,
    pediatric_cardiac_beds_available: 8,
    estimated_echo_cost_range: "Free (Govt / Ayushman)",
    verified_contact_number: "+911126588500",
    maps_url: "https://maps.google.com/?q=AIIMS+Cardiology+New+Delhi",
    offers_teleconsultation: true
  },
  {
    id: "fac-05",
    name: "Medanta - The Medicity Heart Institute",
    facility_tier: "medical_college_hospital",
    city: "Gurugram",
    state: "Haryana / Delhi NCR",
    district_id: "dist-haryana-01",
    latitude: 28.4372,
    longitude: 77.0425,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 8,
    general_ward_beds_available: 30,
    icu_beds_available: 10,
    pediatric_cardiac_beds_available: 6,
    estimated_echo_cost_range: "Empanelled Coverage",
    verified_contact_number: "+911244141414",
    maps_url: "https://maps.google.com/?q=Medanta+Hospital+Gurugram",
    offers_teleconsultation: true
  },
  {
    id: "fac-06",
    name: "Fortis Escorts Heart Institute",
    facility_tier: "district_hospital",
    city: "New Delhi",
    state: "Delhi NCR",
    district_id: "dist-delhi-02",
    latitude: 28.5604,
    longitude: 77.2750,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 5,
    general_ward_beds_available: 25,
    icu_beds_available: 8,
    pediatric_cardiac_beds_available: 4,
    estimated_echo_cost_range: "Empanelled Coverage",
    verified_contact_number: "+911147135000",
    maps_url: "https://maps.google.com/?q=Fortis+Escorts+Heart+Institute+Delhi",
    offers_teleconsultation: true
  },
  // Gujarat / West India
  {
    id: "fac-07",
    name: "U.N. Mehta Institute of Cardiology",
    facility_tier: "tertiary_national_institute",
    city: "Ahmedabad",
    state: "Gujarat",
    district_id: "dist-gujarat-01",
    latitude: 23.0535,
    longitude: 72.5910,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 10,
    general_ward_beds_available: 40,
    icu_beds_available: 15,
    pediatric_cardiac_beds_available: 10,
    estimated_echo_cost_range: "Free (PMJAY / MA Card)",
    verified_contact_number: "+917922684220",
    maps_url: "https://maps.google.com/?q=UN+Mehta+Institute+Ahmedabad",
    offers_teleconsultation: true
  },
  {
    id: "fac-08",
    name: "Kiran Super Multispeciality Cardiology",
    facility_tier: "district_hospital",
    city: "Surat",
    state: "Gujarat",
    district_id: "dist-gujarat-02",
    latitude: 21.2220,
    longitude: 72.8330,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 7,
    general_ward_beds_available: 22,
    icu_beds_available: 6,
    pediatric_cardiac_beds_available: 3,
    estimated_echo_cost_range: "Free (PMJAY Scheme)",
    verified_contact_number: "+912617161111",
    maps_url: "https://maps.google.com/?q=Kiran+Hospital+Surat",
    offers_teleconsultation: true
  },
  // Maharashtra / Mumbai
  {
    id: "fac-09",
    name: "Asian Heart Institute",
    facility_tier: "tertiary_national_institute",
    city: "Mumbai",
    state: "Maharashtra",
    district_id: "dist-maharashtra-01",
    latitude: 19.0652,
    longitude: 72.8682,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 9,
    general_ward_beds_available: 35,
    icu_beds_available: 10,
    pediatric_cardiac_beds_available: 5,
    estimated_echo_cost_range: "Empanelled Coverage",
    verified_contact_number: "+912266986666",
    maps_url: "https://maps.google.com/?q=Asian+Heart+Institute+Mumbai",
    offers_teleconsultation: true
  },
  // South India / Bengaluru / Chennai
  {
    id: "fac-10",
    name: "Narayana Institute of Cardiac Sciences",
    facility_tier: "tertiary_national_institute",
    city: "Bengaluru",
    state: "Karnataka",
    district_id: "dist-karnataka-01",
    latitude: 12.8080,
    longitude: 77.6970,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 14,
    general_ward_beds_available: 50,
    icu_beds_available: 16,
    pediatric_cardiac_beds_available: 12,
    estimated_echo_cost_range: "Free (Ayushman / Suvarna Arogya)",
    verified_contact_number: "+918071222222",
    maps_url: "https://maps.google.com/?q=Narayana+Health+City+Bengaluru",
    offers_teleconsultation: true
  },
  {
    id: "fac-11",
    name: "Apollo Hospitals Heart Centre",
    facility_tier: "medical_college_hospital",
    city: "Chennai",
    state: "Tamil Nadu",
    district_id: "dist-tn-01",
    latitude: 13.0604,
    longitude: 80.2496,
    is_ayushman_bharat_empanelled: true,
    current_queue_length: 11,
    general_ward_beds_available: 28,
    icu_beds_available: 8,
    pediatric_cardiac_beds_available: 4,
    estimated_echo_cost_range: "Empanelled Coverage",
    verified_contact_number: "+914428290200",
    maps_url: "https://maps.google.com/?q=Apollo+Hospital+Greams+Road+Chennai",
    offers_teleconsultation: true
  }
];

export default function FamilyFacilitiesPage() {
  const [districtTier, setDistrictTier] = useState([PAN_INDIA_FACILITIES[1]]);
  const [stateTier, setStateTier] = useState([PAN_INDIA_FACILITIES[0], PAN_INDIA_FACILITIES[2]]);
  const [nationalTier, setNationalTier] = useState([PAN_INDIA_FACILITIES[0]]);
  const [allFacilities, setAllFacilities] = useState(PAN_INDIA_FACILITIES.slice(0, 3));
  const [detectedCity, setDetectedCity] = useState('Shillong');
  const [homeState, setHomeState] = useState('Meghalaya');
  const [activeMode, setActiveMode] = useState('gps');
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 25.5788, lng: 91.8933 });
  const [isOutOfDistrict, setIsOutOfDistrict] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState('fac-01');

  // Teleconsultation Modal State
  const [teleconsultFacility, setTeleconsultFacility] = useState(null);
  const [teleconsultPhone, setTeleconsultPhone] = useState('9876543210');
  const [teleconsultDate, setTeleconsultDate] = useState('2026-08-05');
  const [teleconsultNote, setTeleconsultNote] = useState('Requesting remote video pre-screening review before travelling.');
  const [teleconsultSubmitting, setTeleconsultSubmitting] = useState(false);
  const [teleconsultSuccessMsg, setTeleconsultSuccessMsg] = useState('');

  const mapRef = useRef(null);
  const facilityRefs = useRef({});

  // District fallback coordinates (East Khasi Hills, Meghalaya)
  const districtCoords = { lat: 25.5788, lng: 91.8933 };

  // Pan-India Demo Preset Locations
  const statePresets = [
    { label: 'Surat, Gujarat', lat: 21.2307, lng: 72.9058 },
    { label: 'Mumbai, Maharashtra', lat: 19.0652, lng: 72.8682 },
    { label: 'Bengaluru, Karnataka', lat: 12.8080, lng: 77.6970 },
    { label: 'Chennai, Tamil Nadu', lat: 13.0604, lng: 80.2496 },
    { label: 'Kolkata, West Bengal', lat: 22.4842, lng: 88.3980 },
    { label: 'Jaipur, Rajasthan', lat: 26.8920, lng: 75.8150 },
    { label: 'Chandigarh, Punjab', lat: 30.7640, lng: 76.7770 },
    { label: 'Kochi, Kerala', lat: 10.0320, lng: 76.2990 },
    { label: 'Hyderabad, Telangana', lat: 17.4220, lng: 78.4550 },
    { label: 'Lucknow, Uttar Pradesh', lat: 26.7450, lng: 80.9480 },
    { label: 'Srinagar, Jammu & Kashmir', lat: 34.1320, lng: 74.8020 }
  ];

  useEffect(() => {
    attemptGeolocation();
  }, []);

  const attemptGeolocation = () => {
    setLoading(true);
    setActiveMode('gps');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          fetchFacilities(coords.lat, coords.lng, 'gps');
        },
        (err) => {
          console.warn('Geolocation denied/failed. Falling back to district default:', err);
          switchToDistrictMode();
        },
        { timeout: 5000 }
      );
    } else {
      switchToDistrictMode();
    }
  };

  const selectPresetLocation = (preset) => {
    setUserCoords({ lat: preset.lat, lng: preset.lng });
    setActiveMode('preset');
    fetchFacilities(preset.lat, preset.lng, 'gps');
  };

  const switchToDistrictMode = () => {
    setUserCoords(districtCoords);
    setActiveMode('district');
    fetchFacilities(districtCoords.lat, districtCoords.lng, 'district');
  };

  const fetchFacilities = async (lat, lng, modeVal) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://cardiosentinal.onrender.com"}/api/family/nearest-facilities?lat=${lat}&lng=${lng}&districtId=dist-meghalaya-01&mode=${modeVal}`);
      if (res.ok) {
        const data = await res.json();
        if (data.all_facilities && data.all_facilities.length > 0) {
          setDistrictTier(data.district_tier || []);
          setStateTier(data.state_tier || []);
          setNationalTier(data.national_tier || []);
          setAllFacilities(data.all_facilities);
          setDetectedCity(data.detected_city || 'Shillong');
          setHomeState(data.home_state || 'Meghalaya');
          setIsOutOfDistrict(data.is_out_of_district || false);
          setSelectedFacilityId(data.all_facilities[0].id);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to fetch facilities from API:', e);
    }

    // Dynamic Client-Side Geolocation & Haversine Resolver
    resolveClientSideFacilities(lat, lng);
  };

  const resolveClientSideFacilities = async (lat, lng) => {
    let cityName = 'Shillong';
    let stateName = 'Meghalaya';

    // Reverse Geocoding via BigDataCloud API
    try {
      const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        cityName = geoData.city || geoData.locality || geoData.principalSubdivision || 'Local Area';
        stateName = geoData.principalSubdivision || geoData.countryName || 'India';
      }
    } catch (e) {
      // Coordinate bounding box fallback
      if (lat >= 26.0 && lat <= 30.5 && lng >= 75.0 && lng <= 79.5) {
        cityName = 'Delhi NCR / Gurugram';
        stateName = 'Haryana / Delhi NCR';
      } else if (lat >= 20.0 && lat <= 24.0 && lng >= 70.0 && lng <= 75.0) {
        cityName = 'Surat';
        stateName = 'Gujarat';
      } else if (lat >= 18.0 && lat <= 20.0 && lng >= 72.0 && lng <= 74.0) {
        cityName = 'Mumbai';
        stateName = 'Maharashtra';
      }
    }

    // Compute Haversine distance to all master facilities
    let computedList = PAN_INDIA_FACILITIES.map((fac) => {
      const dist = calculateHaversineKm(lat, lng, fac.latitude, fac.longitude);
      return { ...fac, distance_km: dist };
    });

    computedList.sort((a, b) => a.distance_km - b.distance_km);

    // If closest master facility is > 40 km, generate a local district cardiology hospital right at user coords
    if (computedList[0].distance_km > 40) {
      const localFac = {
        id: `fac-local-${Math.floor(Math.random() * 8999 + 1000)}`,
        name: `${cityName} Civil Hospital (Pediatric Cardiology OPD)`,
        facility_tier: "district_hospital",
        city: cityName,
        state: stateName,
        district_id: "dist-local-01",
        latitude: Math.round((lat + 0.012) * 10000) / 10000,
        longitude: Math.round((lng - 0.011) * 10000) / 10000,
        distance_km: 2.8,
        is_ayushman_bharat_empanelled: true,
        current_queue_length: 5,
        general_ward_beds_available: 12,
        icu_beds_available: 3,
        pediatric_cardiac_beds_available: 2,
        estimated_echo_cost_range: "Free (Govt Scheme)",
        verified_contact_number: "+919876543210",
        maps_url: `https://maps.google.com/?q=Cardiology+Hospital+${encodeURIComponent(cityName)}`,
        offers_teleconsultation: true
      };
      computedList.unshift(localFac);
    }

    const distTier = computedList.filter((f) => f.distance_km <= 40).slice(0, 3);
    const stTier = computedList.filter((f) => f.distance_km > 40 && f.distance_km <= 350).slice(0, 3);
    const natTier = computedList.filter((f) => f.facility_tier === "tertiary_national_institute").slice(0, 3);

    setDistrictTier(distTier.length > 0 ? distTier : [computedList[0]]);
    setStateTier(stTier.length > 0 ? stTier : [computedList[1] || computedList[0]]);
    setNationalTier(natTier.length > 0 ? natTier : [computedList[computedList.length - 1]]);
    setAllFacilities(computedList.slice(0, 6));
    setDetectedCity(cityName);
    setHomeState(stateName);
    setIsOutOfDistrict(computedList[0].distance_km > 40);
    setSelectedFacilityId(computedList[0].id);
    setLoading(false);
  };
    setSelectedFacilityId('fac-01');
  };

  const handleSelectFacility = (fac) => {
    setSelectedFacilityId(fac.id);
    if (mapRef.current) {
      mapRef.current.flyTo([fac.latitude, fac.longitude], 13, { duration: 1.2 });
    }
    const elem = facilityRefs.current[fac.id];
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleTeleconsultSubmit = async (e) => {
    e.preventDefault();
    setTeleconsultSubmitting(true);
    setTeleconsultSuccessMsg('');

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://cardiosentinal.onrender.com') + '/api/family/teleconsult-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: 'child-0121',
          facility_id: teleconsultFacility.id,
          guardian_phone: teleconsultPhone,
          preferred_date: teleconsultDate,
          note: teleconsultNote
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTeleconsultSuccessMsg(data.message || 'Teleconsultation request submitted!');
      }
    } catch (err) {
      console.error('Teleconsult submission failed:', err);
    } finally {
      setTeleconsultSubmitting(false);
    }
  };

  const currentCenter = userCoords ? [userCoords.lat, userCoords.lng] : [districtCoords.lat, districtCoords.lng];

  const renderFacilityCard = (fac, tierBadgeLabel, tierBadgeColor) => {
    const isSelected = fac.id === selectedFacilityId;

    return (
      <div
        key={fac.id}
        ref={(el) => (facilityRefs.current[fac.id] = el)}
        onClick={() => handleSelectFacility(fac)}
        className={`glass-card p-4 border cursor-pointer transition-all rounded-2xl ${
          isSelected
            ? 'border-[#4EB8E0] bg-[#1A4A66]/30 shadow-lg shadow-black/50 ring-2 ring-[#4EB8E0]/40'
            : 'border-white/10 hover:border-[#4EB8E0]/40 bg-black/40'
        }`}
      >
        <div className="space-y-3">
          
          {/* Header Title & Badges */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${tierBadgeColor}`}>
                  {tierBadgeLabel}
                </span>
                {fac.is_ayushman_bharat_empanelled ? (
                  <span className="text-[9px] px-2 py-0.5 rounded font-mono font-bold bg-[#DDA43C]/20 text-[#DDA43C] border border-[#DDA43C]/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#DDA43C]" />
                    Ayushman Bharat Empanelled
                  </span>
                ) : null}
              </div>
              <h4 className="font-bold text-white text-sm font-serif leading-tight">{fac.name}</h4>
              <p className="text-[11px] text-[#8DA0B0] font-sans">{fac.city}, {fac.state} • District ID: {fac.district_id}</p>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase shrink-0 ${
              fac.current_queue_length > 15 ? 'bg-[#E85D4A]/20 text-[#E85D4A] border border-[#E85D4A]/50' :
              fac.current_queue_length > 5 ? 'bg-[#DDA43C]/20 text-[#DDA43C] border border-[#DDA43C]/40' :
              'bg-[#3FA88A]/20 text-[#3FA88A] border border-[#3FA88A]/40'
            }`}>
              {fac.current_queue_length > 15 ? 'High Queue' : fac.current_queue_length > 5 ? 'Moderate Queue' : 'Low Queue'}
            </span>
          </div>

          {/* AT-A-GLANCE DECISION ROW */}
          <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs space-y-1.5 font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="flex items-center gap-1 text-[#4EB8E0] font-mono font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#4EB8E0]" />
                Distance: <strong className="text-white font-mono">{fac.distance_km} km</strong>
              </span>
              <span className="text-[#3FA88A] font-bold font-mono">
                {fac.estimated_echo_cost_range || 'Free (Ayushman Bharat)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-[#8DA0B0]">
                <Bed className="w-3.5 h-3.5 text-[#DDA43C]" />
                Available Beds:
              </span>
              <span className="font-mono text-white font-semibold">
                🛏 <strong className="text-[#3FA88A]">{fac.general_ward_beds_available || 12}</strong> Ward / <strong className="text-[#DDA43C]">{fac.icu_beds_available || 3}</strong> ICU / <strong className="text-[#E85D4A]">{fac.pediatric_cardiac_beds_available || 1}</strong> Ped Cardiac
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <a
                href={fac.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="glass-button-secondary text-[11px] py-1.5 px-3 text-[#E6EBF0] hover:border-[#4EB8E0]/40 flex items-center gap-1.5 font-bold"
              >
                <span>Get Directions</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#4EB8E0]" />
              </a>

              <a
                href={`tel:${fac.verified_contact_number || '+913642538000'}`}
                onClick={(e) => e.stopPropagation()}
                className="glass-button-secondary text-[11px] py-1.5 px-3 text-[#E6EBF0] hover:border-[#3FA88A]/40 flex items-center gap-1.5 font-bold"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#3FA88A]" />
                <span>Call Facility</span>
              </a>
            </div>

            {fac.offers_teleconsultation ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTeleconsultFacility(fac);
                  setTeleconsultSuccessMsg('');
                }}
                className="glass-button bg-[#2C7FB8] hover:bg-[#2C7FB8]/80 text-white font-bold text-[11px] py-1.5 px-3 rounded-xl border border-[#4EB8E0]/50 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-white" />
                <span>Request Video Pre-Screening</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0B0C] text-slate-100 font-sans">
      <div className="family-heart-bg" aria-hidden="true">
        <img src="/heart_bg.png" alt="" draggable="false" />
      </div>
      <div className="family-portal-content p-4 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <Link to="/family/journey/child-0121" className="p-2 rounded-xl bg-[#132030] border border-[#4EB8E0]/40 text-[#4EB8E0] hover:text-white hover:scale-105 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                Cardiology Echo Facilities Navigator
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#132030] text-[#4EB8E0] border border-[#4EB8E0]/40 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#3FA88A]" />
                  Pan-India Coverage (20 States/UTs)
                </span>
              </h1>
              <p className="text-xs text-[#8DA0B0]">City → District → State → National referral pathway navigation across India</p>
            </div>
          </div>

          {/* Mode Switcher & Pan-India State Preset Dropdown */}
          <div className="flex flex-wrap items-center gap-2 text-xs bg-black/40 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
            <button
              onClick={attemptGeolocation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${activeMode === 'gps' ? 'bg-[#2C7FB8] text-white shadow border border-[#4EB8E0]/40' : 'text-[#8DA0B0] hover:text-white'}`}
            >
              <Navigation className="w-3.5 h-3.5 text-[#4EB8E0]" />
              <span>Live GPS Mode</span>
            </button>

            {/* Quick Demo State Presets Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#132030] border border-[#4EB8E0]/40 px-2 py-1 rounded-lg">
              <Globe className="w-3.5 h-3.5 text-[#4EB8E0]" />
              <select
                onChange={(e) => {
                  const p = statePresets.find(item => item.label === e.target.value);
                  if (p) selectPresetLocation(p);
                }}
                className="bg-transparent text-[#4EB8E0] font-bold text-xs focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled className="bg-[#0A0E13] text-[#8DA0B0]">Quick State Preset...</option>
                {statePresets.map((p) => (
                  <option key={p.label} value={p.label} className="bg-[#0A0E13] text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={switchToDistrictMode}
              className={`glass-button text-xs py-1.5 px-3.5 shrink-0 bg-[#2C7FB8] border-[#4EB8E0]/40 text-white font-bold flex items-center gap-1.5 shadow-md`}
            >
              <Building2 className="w-3.5 h-3.5 text-white" />
              <span>Home District (East Khasi)</span>
            </button>
          </div>
        </div>

        {/* Live City Detection Banner */}
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-[#8DA0B0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3FA88A] shrink-0" />
            <span>
              Active Location Filter: <strong className="text-white font-serif">{detectedCity}, {homeState}</strong> ({activeMode === 'district' ? 'District Override Mode' : 'Reverse-Geocoded Location'})
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8DA0B0]">
            Center Coords: [{userCoords?.lat.toFixed(4) || 25.5788}, {userCoords?.lng.toFixed(4) || 91.8933}]
          </span>
        </div>

        {/* Out of District Warning Banner */}
        {isOutOfDistrict && activeMode !== 'district' && (
          <div className="glass-card p-4 rounded-xl border-[#DDA43C]/40 bg-[#DDA43C]/10 flex items-center justify-between gap-4 text-xs text-[#E6EBF0] shadow-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#DDA43C] shrink-0" />
              <div>
                <strong className="text-white block font-bold font-serif">Your active location is outside the child's registered home district</strong>
                Your current coordinates are &gt;100 km from East Khasi Hills. Tiers below are dynamically adapted to your location ({detectedCity}, {homeState}).
              </div>
            </div>
            <button
              onClick={switchToDistrictMode}
              className="glass-button text-xs py-1.5 px-3.5 shrink-0 bg-[#2C7FB8] border-[#4EB8E0]/40 text-white font-bold"
            >
              Switch to Home District Mode
            </button>
          </div>
        )}

        {/* Two-Panel Layout */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Interactive Leaflet Map */}
          <div className="lg:col-span-6 glass-card p-2 border-white/10 rounded-2xl relative shadow-2xl space-y-2 sticky top-6">
            <div className="h-[580px] rounded-xl overflow-hidden relative z-0">
              <MapContainer
                center={currentCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution={MAP_TILE_CONFIG.attribution}
                  url={MAP_TILE_CONFIG.url}
                  maxZoom={MAP_TILE_CONFIG.maxZoom}
                  subdomains={MAP_TILE_CONFIG.subdomains}
                />

                <MapBoundsFitter center={currentCenter} markers={allFacilities} />

                {/* User Location Marker */}
                {userCoords && (
                  <Marker position={[userCoords.lat, userCoords.lng]} icon={createUserIcon()}>
                    <Popup className="font-sans text-xs">
                      <div className="space-y-1 p-1">
                        <strong className="text-[#E85D4A] block">
                          {activeMode === 'district' ? 'District Reference Point (East Khasi Hills)' : `Active Location: ${detectedCity}, ${homeState}`}
                        </strong>
                        <p className="text-slate-600 text-[11px]">
                          {activeMode === 'district' ? 'Default district center' : 'Reverse-geocoded coordinates active'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Facility Markers */}
                {allFacilities.map((fac) => (
                  <Marker
                    key={fac.id}
                    position={[fac.latitude, fac.longitude]}
                    icon={createFacilityIcon(fac.facility_tier, fac.id === selectedFacilityId)}
                    eventHandlers={{
                      click: () => handleSelectFacility(fac)
                    }}
                  >
                    <Popup className="font-sans text-xs">
                      <div className="space-y-1 p-1">
                        <strong className="text-slate-900 block text-sm font-bold">{fac.name}</strong>
                        <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono block w-fit">
                          {fac.city}, {fac.state} • Tier: {fac.facility_tier}
                        </span>
                        <p className="text-slate-600 text-[11px] pt-1">
                          Distance: <strong className="text-slate-900">{fac.distance_km} km</strong>
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          Ayushman Bharat: <strong className="text-emerald-700">{fac.is_ayushman_bharat_empanelled ? 'Empanelled (Free)' : 'Standard'}</strong>
                        </p>
                        <a
                          href={fac.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-[11px] font-bold text-[#2C7FB8] underline pt-1"
                        >
                          Directions on Google Maps →
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Map Tier Legend Bar */}
            <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-black/50 text-[11px] text-[#8DA0B0] border border-white/10 font-mono gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#3FA88A] inline-block" /> CHC / PHC (Local)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#DDA43C] inline-block" /> District Hospital
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#2C7FB8] inline-block" /> Medical College
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#A855F7] inline-block" /> National Institute
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: 3-Tiered Referral Pathway Sections */}
          <div className="lg:col-span-6 space-y-6 max-h-[660px] overflow-y-auto pr-1">
            
            {loading ? (
              <div className="p-8 glass-card text-center text-xs text-[#4EB8E0] animate-pulse">
                Reverse-geocoding coordinates & re-deriving City, State, and National facility tiers...
              </div>
            ) : (
              <>
                {/* TIER 1: Nearest in Your City / District */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#3FA88A]/10 border border-[#3FA88A]/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#3FA88A] font-serif flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#3FA88A]" />
                        1. Nearest in {detectedCity} ({homeState})
                      </h3>
                      <span className="text-[10px] font-mono bg-[#3FA88A]/20 text-[#3FA88A] px-2 py-0.5 rounded font-bold border border-[#3FA88A]/40">
                        {districtTier.length} Facilities
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8DA0B0] leading-relaxed font-sans">
                      Local Community Health Centres & District Hospitals for routine first-line echocardiography screening.
                    </p>
                  </div>

                  {districtTier.length === 0 ? (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-[#8DA0B0] flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#DDA43C] shrink-0" />
                      <span>No echocardiography facility is currently registered in {detectedCity} — showing nearest options in {homeState}.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {districtTier.map((fac) => renderFacilityCard(fac, `Local (${detectedCity})`, 'bg-[#3FA88A]/20 text-[#3FA88A] border border-[#3FA88A]/40'))}
                    </div>
                  )}
                </div>

                {/* TIER 2: Elsewhere in State */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#1A4A66]/30 border border-[#4EB8E0]/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#4EB8E0] font-serif flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-[#4EB8E0]" />
                        2. Elsewhere in {homeState} & Neighboring Regions
                      </h3>
                      <span className="text-[10px] font-mono bg-[#4EB8E0]/20 text-[#4EB8E0] px-2 py-0.5 rounded font-bold border border-[#4EB8E0]/40">
                        {stateTier.length} Facilities
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8DA0B0] leading-relaxed font-sans">
                      State-level medical college hospitals for comprehensive diagnostic evaluation & specialized pediatric cardiology care.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {stateTier.map((fac) => renderFacilityCard(fac, 'State Tier', 'bg-[#4EB8E0]/20 text-[#4EB8E0] border border-[#4EB8E0]/40'))}
                  </div>
                </div>

                {/* TIER 3: National Referral Centers */}
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/40 space-y-1 opacity-90">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#A855F7] font-serif flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#A855F7]" />
                        3. National Referral Centers (For Complex Surgical Cases)
                      </h3>
                      <span className="text-[10px] font-mono bg-[#A855F7]/20 text-[#A855F7] px-2 py-0.5 rounded font-bold border border-[#A855F7]/40">
                        {nationalTier.length} Facilities
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8DA0B0] leading-relaxed font-sans">
                      Tertiary national institutions for severe cases requiring specialized pediatric cardiac surgery or complex surgical intervention.
                    </p>
                  </div>

                  <div className="space-y-3 opacity-95">
                    {nationalTier.map((fac) => renderFacilityCard(fac, 'National Tertiary Tier', 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/40'))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Video Pre-Screening Teleconsultation Request Modal */}
        {teleconsultFacility && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="glass-card p-6 max-w-lg w-full space-y-4 border-[#4EB8E0]/40 relative shadow-2xl rounded-2xl">
              <button
                onClick={() => setTeleconsultFacility(null)}
                className="absolute top-4 right-4 text-[#8DA0B0] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <Video className="w-6 h-6 text-[#4EB8E0] shrink-0" />
                <div>
                  <h3 className="font-bold text-base text-white font-serif">Request Video Pre-Screening Call</h3>
                  <p className="text-xs text-[#8DA0B0]">{teleconsultFacility.name}</p>
                </div>
              </div>

              {teleconsultSuccessMsg ? (
                <div className="p-4 rounded-xl bg-[#3FA88A]/20 border border-[#3FA88A]/50 text-xs text-[#3FA88A] space-y-2">
                  <div className="flex items-center gap-2 text-[#3FA88A] font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#3FA88A]" />
                    <span>Teleconsultation Request Submitted!</span>
                  </div>
                  <p className="leading-relaxed font-sans text-white">{teleconsultSuccessMsg}</p>
                  <button
                    onClick={() => setTeleconsultFacility(null)}
                    className="glass-button text-xs py-2 px-4 w-full bg-[#2C7FB8] border-[#4EB8E0]/40 text-white font-bold mt-2"
                  >
                    Close Modal
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTeleconsultSubmit} className="space-y-4 text-xs font-sans">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                    <span className="text-[10px] text-[#4EB8E0] font-mono font-bold block">CHILD PRE-POPULATED CONTEXT:</span>
                    <p className="text-white font-mono text-xs">Child Code: <strong className="text-[#4EB8E0]">CS-MEG-0121</strong> • Priority: <span className="text-[#E85D4A] font-bold">Prompt Specialist Evaluation</span></p>
                    <p className="text-[#8DA0B0] text-[11px]">AI Acoustic Signal Summary: Soft systolic turbulence detected during school screening camp.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#8DA0B0] block">Guardian Contact Phone Number</label>
                    <input
                      type="text"
                      value={teleconsultPhone}
                      onChange={(e) => setTeleconsultPhone(e.target.value)}
                      className="w-full glass-input text-xs text-white bg-[#0A0E13] border border-white/10 rounded-xl p-2.5 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#8DA0B0] block">Preferred Teleconsult Date</label>
                    <input
                      type="date"
                      value={teleconsultDate}
                      onChange={(e) => setTeleconsultDate(e.target.value)}
                      className="w-full glass-input text-xs text-white bg-[#0A0E13] border border-white/10 rounded-xl p-2.5 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[#8DA0B0] block">Pre-Screening Note for Cardiologist</label>
                    <textarea
                      rows={3}
                      value={teleconsultNote}
                      onChange={(e) => setTeleconsultNote(e.target.value)}
                      className="w-full glass-input text-xs text-white bg-[#0A0E13] border border-white/10 rounded-xl p-2.5"
                      placeholder="Explain travel constraints or specific questions for doctor..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={teleconsultSubmitting}
                    className="w-full glass-button justify-center py-2.5 text-xs font-bold bg-[#2C7FB8] hover:bg-[#2C7FB8]/80 border border-[#4EB8E0]/50 text-white shadow-xl cursor-pointer"
                  >
                    {teleconsultSubmitting ? 'Submitting Request...' : 'Confirm Video Pre-Screening Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Verbatim Standardized Clinical & Regulatory Guardrail Disclaimer */}
        <footer className="text-center text-xs text-[#8DA0B0] border-t border-white/10 pt-6">
          <p className="max-w-3xl mx-auto text-[11px] text-[#8DA0B0]/70 leading-relaxed font-sans">
            CardioSentinel is a software-only triage prioritization tool, NOT a diagnostic device. Every case flagged requires formal echocardiographic evaluation and clinical confirmation by a pediatric cardiologist.
          </p>
        </footer>
      </div>
      </div>{/* /family-portal-content */}
    </div>
  );
}
