import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
// react-native-maps class-component types are incompatible with React 19 — suppress at usage
// eslint-disable-next-line @typescript-eslint/no-require-imports
import MapViewImport, { Marker as MarkerImport } from 'react-native-maps';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MapView = MapViewImport as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Marker = MarkerImport as any;
import type { Venue } from '@workspace/api-client-react';
import { crowdColor } from '@/lib/venue-ui';

export type VenuePinsMapHandle = {
  animateTo: (latitude: number, longitude: number) => void;
};

export type VenuePinsMapProps = {
  venues: Venue[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  showsUserLocation: boolean;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b0f1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a96' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0f1a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1c2333' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#101725' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0e1420' }] },
];

export const VenuePinsMap = forwardRef<VenuePinsMapHandle, VenuePinsMapProps>(
  function VenuePinsMap({ venues, selectedId, onSelect, showsUserLocation, initialRegion }, ref) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      animateTo: (latitude, longitude) => {
        mapRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 },
          600,
        );
      },
    }));

    return (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPress={() => onSelect(null)}
        testID="pulse-map"
      >
        {venues.map((venue) => {
          const color = crowdColor(venue.crowdLevel);
          const isSelected = venue.id === selectedId;
          return (
            <Marker
              key={venue.id}
              coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
              onPress={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                onSelect(venue.id);
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              testID={`pin-${venue.id}`}
            >
              <View
                style={[
                  styles.pin,
                  {
                    backgroundColor: color,
                    borderColor: isSelected ? '#ffffff' : '#0b0f1a',
                    width: isSelected ? 22 : 16,
                    height: isSelected ? 22 : 16,
                    shadowColor: color,
                  },
                ]}
              />
            </Marker>
          );
        })}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  pin: {
    borderRadius: 999,
    borderWidth: 2,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
