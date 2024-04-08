'use client'

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Draw from 'ol/interaction/Draw';
import Circle from 'ol/geom/Circle';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import { getArea, getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import Overlay from 'ol/Overlay';
import Image from 'next/image';

const Home: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [drawType, setDrawType] = useState<string>('Point');

  useEffect(() => {
    if (mapRef.current) {
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat([78.9629, 20.5937]),
          zoom: 5,
        }),
      });

      // Implement functionality to allow users to locate a pinpoint on the map
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
      });
      map.addLayer(vectorLayer);

      const handleDrawEnd = (event: any) => {
        const geometry = event.feature.getGeometry();
        if (geometry) {
          let measurement;
          if (geometry instanceof Polygon) {
            measurement = getArea(geometry);
            console.log('Area:', measurement);
          } else if (geometry instanceof LineString) {
            measurement = getLength(geometry);
            console.log('Length:', measurement);
          } else if (geometry instanceof Circle) {
            const radius = geometry.getRadius();
            measurement = Math.PI * radius ** 2;
            console.log('Area:', measurement);
          } else {
            // console.error('Unsupported geometry type');
            return;
          }
        } else {
          console.error('Geometry is undefined');
          return;
        }
      };

      const createDrawInteraction = (type: string, markerStyle?: Style) => {
        let olType: any;
        let style;
    
        switch (type) {
            case 'LineString':
                olType = 'LineString';
                style = new Style({
                    stroke: new Stroke({
                        color: 'red',
                        width: 2,
                    }),
                });
                break;
            case 'Polygon':
                olType = 'Polygon';
                style = new Style({
                    fill: new Fill({
                        color: 'rgba(255, 0, 0, 0.2)',
                    }),
                    stroke: new Stroke({
                        color: 'red',
                        width: 2,
                    }),
                });
                break;
            case 'Circle':
                olType = 'Circle';
                style = new Style({
                    stroke: new Stroke({
                        color: 'red',
                        width: 2,
                    }),
                    image: new CircleStyle({
                        radius: 5,
                        fill: new Fill({ color: 'red' }),
                        stroke: new Stroke({ color: 'white', width: 2 }),
                    }),
                });
                break;
            default:
                olType = 'Point';
                style = new Style({
                    image: new CircleStyle({
                        radius: 10,
                        fill: new Fill({ color: 'red' }),
                        stroke: new Stroke({ color: 'white', width: 2 }),
                    }),
                });
        }
    
        if (markerStyle && type === 'Point') {
            // Override default style if a custom marker style is provided
            style = markerStyle;
        }
    
        return new Draw({
            source: vectorSource,
            type: olType,
            style: style,
        });
    };
    
    // Usage
    const markerStyle = new Style({
        image: new Icon({
            src: '/map-marker.png',
            scale: 0.08,
            anchor: [0.5, 1],
        }),
    });
    
    const drawInteraction = createDrawInteraction(drawType, markerStyle);
    map.addInteraction(drawInteraction);
    
    drawInteraction.on('drawend', (event: any) => {
        const feature = event.feature;
        if(drawType === 'Point') {
          feature.setStyle(markerStyle);
        }
        handleDrawEnd(event);
    });
    


      // Function to add a marker to the map
      const addMarker = (coords: [number, number], zoomLevel: number) => {
        // Create a point geometry from the provided coordinates
        const pointGeometry = new Point(fromLonLat(coords));

        // Create a marker feature with the point geometry
        const markerFeature = new Feature({
          geometry: pointGeometry,
        });

        // Define the style for the marker
        const markerStyle = new Style({
          image: new Icon({
              src: '/map-marker.png', // Replace 'your-custom-marker-image.png' with the path to your image inside the 'public' folder
              scale: 0.08, // Adjust the scale of the marker image as needed
              anchor: [0.5, 1],
          }),
      });

        // Apply the style to the marker feature
        markerFeature.setStyle(markerStyle);

        // Create a vector source and layer for the marker
        const markerSource = new VectorSource({
          features: [markerFeature],
        });

        const markerLayer = new VectorLayer({
          source: markerSource,
        });

        map.addLayer(markerLayer);

        // Create a popup element
        const popupElement = document.createElement('div');
        popupElement.className = 'popup';
        popupElement.innerHTML = `<div style="background-color: crimson;
        padding: 10px;
        border-radius: 10px;"><p style="font-weight: 700;
        padding-bottom: 5px;">Your Current Location</p><p>Latitude: ${coords[1]}</p><p>Longitude: ${coords[0]}</p></div>`;

        // Create a popup overlay
        const popupOverlay = new Overlay({
          element: popupElement,
          positioning: 'bottom-center',
          offset: [0, -50],
        });

        // Add the popup overlay to the map
        map.addOverlay(popupOverlay);

        // Set the position of the popup overlay to the marker coordinates
        popupOverlay.setPosition(fromLonLat(coords));

        // Adjust the map view to center on the marker coordinates and zoom to the specified zoom level
        const view = map.getView();
        view.setCenter(fromLonLat(coords));
        view.setZoom(zoomLevel);
      };


      // Get user's location and add a marker
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        addMarker([longitude, latitude], 10);
      });

      return () => {
        map?.setTarget(undefined);
      };
    }
  }, [drawType]);


  const handleDrawTypeChange = (type: string) => {
    setDrawType(type);
  };

  return <>
    <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />;


    <div className="fixed z-50 w-full h-16 max-w-sm -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-4 left-1/2 dark:bg-gray-700 dark:border-gray-600">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto">
        <button onClick={() => handleDrawTypeChange('Circle')} data-tooltip-target="tooltip-home" type="button" className="inline-flex flex-col items-center justify-center px-5 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
        <Image src="/full-moon.png" alt="Circle" width={20} height={20} />
          <span className="sr-only">Circle</span>
        </button>
        <div id="tooltip-home" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          Home
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button onClick={() => handleDrawTypeChange('Polygon')} data-tooltip-target="tooltip-wallet" type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
        <Image src="/polygon.png" alt="Circle" width={30} height={30} />
          <span className="sr-only">Polygon</span>
        </button>
        <div id="tooltip-wallet" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          Wallet
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button onClick={() => handleDrawTypeChange('LineString')} data-tooltip-target="tooltip-wallet" type="button" className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
        <Image src="/diagonal-line.png" alt="Circle" width={20} height={20} />

          <span className="sr-only">LineString</span>
        </button>
        <div id="tooltip-wallet" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          Wallet
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button onClick={() => handleDrawTypeChange('Point')} data-tooltip-target="tooltip-profile" type="button" className="inline-flex flex-col items-center justify-center px-5 rounded-e-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
        <Image src="/map-marker.png" alt="Circle" width={30} height={30} />

          <span className="sr-only">Point</span>
        </button>
        <div id="tooltip-profile" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
          Profile
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
    </div>

  </>
};

export default Home;
