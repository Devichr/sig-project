import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import "ol/ol.css";
import { Map, View } from "ol";
import { Tile as TileLayer } from "ol/layer";
import { OSM } from "ol/source";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { Style, Text, Fill, Stroke } from "ol/style";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import "./App.css"; // Custom styling 
import sortAsc from "./assets/icons/sort.png";
import sortDesc from "./assets/icons/sort (1).png";

function App() {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [editId, setEditId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const mapRef = useRef(null); // Reference for the map
  const vectorSourceRef = useRef(new VectorSource()); // Reference for the vector source
  const [currentPage, setCurrentPage] = useState(1);
  const [locationsPerPage] = useState(5); 
  const [isAscending, setIsAscending] = useState(true); // State for sorting order

  // Hitung indeks awal dan akhir lokasi untuk halaman saat ini
  const indexOfLastLocation = currentPage * locationsPerPage;
  const indexOfFirstLocation = indexOfLastLocation - locationsPerPage;
  const currentLocations = locations.slice(
    indexOfFirstLocation,
    indexOfLastLocation
  );

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(locations.length / locationsPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);


  const fetchLocations = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:3001/locations");
      setLocations(response.data);
      // Clear existing features
      vectorSourceRef.current.clear();
      // Add features for each location
      response.data.forEach((location) => {
        const feature = new Feature({
          geometry: new Point(
            fromLonLat([location.longitude, location.latitude])
          ),
          name: location.name,
        });
        feature.setStyle(
          new Style({
            text: new Text({
              text: location.name,
              offsetY: -15,
              font: "12px Calibri,sans-serif",
              fill: new Fill({
                color: "#000",
              }),
              stroke: new Stroke({
                color: "#fff",
                width: 2,
              }),
              backgroundFill: new Fill({
                color: "#fff",
              }),
              backgroundStroke: new Stroke({
                color: "#000",
                width: 1,
              }),
              padding: [2, 2, 2, 2],
            }),
          })
        );
        vectorSourceRef.current.addFeature(feature);
      });
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, []);

  useEffect(() => {
    fetchLocations();

    // Initialize the map only once
    if (!mapRef.current) {
      mapRef.current = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          new VectorLayer({
            source: vectorSourceRef.current,
          }),
        ],
        view: new View({
          center: fromLonLat([107.61018, -6.89028]),
          zoom: 14,
        }),
      });
    }
  }, [fetchLocations]);

  const handleSearchAddress = async () => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );
      if (response.data.length === 0) {
        setErrorMessage("Address not found");
        setSearchResults([]);
        return;
      }
      setSearchResults(response.data);
      setErrorMessage(""); // Clear previous error message
    } catch (error) {
      console.error("Error searching address:", error);
    }
  };

  const handleAddLocation = async (event) => {
    event.preventDefault();
    try {
      const newLocation = { name, address };
      if (editId) {
        await axios.put(
          `http://localhost:3001/edit-location/${editId}`,
          newLocation
        );
        setEditId(null);
      } else {
        await axios.post("http://localhost:3001/add-location", newLocation);
      }
      fetchLocations();
      setName("");
      setAddress("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error adding location:", error);
    }
  };

  const handleEdit = (location) => {
    setName(location.name);
    setAddress(location.address);
    setEditId(location.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/delete-location/${id}`);
      fetchLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
    }
  };

  const handleSelectAddress = (result) => {
    setAddress(result.display_name);
    setSearchResults([]);
  };
  const mergeSort = (array, key) => {
    if (array.length <= 1) {
      return array;
    }
  
    const middleIndex = Math.floor(array.length / 2);
    const leftArray = array.slice(0, middleIndex);
    const rightArray = array.slice(middleIndex);
  
    return merge(
      mergeSort(leftArray, key),
      mergeSort(rightArray, key),
      key
    );
  };
  
  const merge = (leftArray, rightArray, key) => {
    let sortedArray = [];
  
    while (leftArray.length && rightArray.length) {
      if (leftArray[0][key] < rightArray[0][key]) {
        sortedArray.push(leftArray.shift());
      } else {
        sortedArray.push(rightArray.shift());
      }
    }
  
    return sortedArray.concat(leftArray).concat(rightArray);
  };
  
  const handleSortByDistance = () => {
    const sortedLocations = mergeSort(locations, "distance_to_campus");
    if (!isAscending) {
      sortedLocations.reverse();
    }
    setLocations(sortedLocations);
    setIsAscending(!isAscending);
  };

  return (
    <div className="container">
      <h1>Sistem Informasi Geografis Mahasiswa</h1>
      <form onSubmit={handleAddLocation} className="form">
        <div className="form-group">
          <label htmlFor="name">Nama:</label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">Alamat:</label>
          <input
            id="address"
            name="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={handleSearchAddress}
            className="btn btn-search"
          >
            Cari alamat
          </button>
          <ul className="search-results">
            {searchResults.map((result) => (
              <li
                key={result.place_id}
                onClick={() => handleSelectAddress(result)}
              >
                {result.display_name}
              </li>
            ))}
          </ul>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
        <button type="submit" className="btn" disabled={!address}>
          {editId ? "Update lokasi" : "Tambahkan lokasi"}
        </button>
      </form>
      

      <h2>Mahasiswa Terdaftar</h2>
      <table className="table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Alamat</th>
            <th>Jarak ke kampus (km)
            <button onClick={handleSortByDistance} className="btn-sort">
                {isAscending ? (
                  <img src={sortAsc} alt="sort" />
                ) : (
                  <img src={sortDesc} alt="sort" />
                )}
              </button>
            </th>
            <th>Opsi</th>
          </tr>
        </thead>
        <tbody>
          {currentLocations.map((location, index) => (
            <tr key={location.id}>
              <td>{index + 1}</td>
              <td>{location.name}</td>
              <td>{location.address}</td>
              <td>{location.distance_to_campus}</td>
              <td>
                <button onClick={() => handleEdit(location)} className="btn">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        {pageNumbers.map((number) => (
          <button key={number} onClick={() => paginate(number)}   className={`btn ${number === currentPage ? 'active' : ''}`}>
            {number}
          </button>
        ))}
      </div>

      <div id="map" className="map"></div>
    </div>
  );
}

export default App;
