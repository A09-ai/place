const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const dotenv = require("dotenv");

dotenv.config();
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });

mongoose.connect("mongodb://127.0.0.1:27017/majorproject2") // अपने DB का नाम डालो
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

async function updateLocations() {
  try {
    const listings = await Listing.find({});
    for (let listing of listings) {
      if ((!listing.location || listing.location.trim() === "") &&
          listing.geometry &&
          listing.geometry.coordinates &&
          listing.geometry.coordinates.length === 2) {

        const [lng, lat] = listing.geometry.coordinates;
        console.log(`📍 Reverse geocoding for: ${listing.title}`);

        const response = await geocodingClient.reverseGeocode({
          query: [lng, lat],
          limit: 1
        }).send();

        if (response.body.features.length > 0) {
          listing.location = response.body.features[0].place_name;
          await listing.save();
          console.log(`✅ Updated: ${listing.title} → ${listing.location}`);
        } else {
          console.log(`⚠️ No location found for ${listing.title}`);
        }
      }
    }
    console.log("🎯 All locations updated!");
  } catch (err) {
    console.log("❌ Error:", err);
  } finally {
    mongoose.connection.close();
  }
}

updateLocations();
