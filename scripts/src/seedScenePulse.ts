import { db, venuesTable, commentsTable, liveReportsTable } from "@workspace/db";
import type { InsertVenue } from "@workspace/db";

type SeedVenue = Omit<InsertVenue, "isWatchlisted">;

const CATEGORY_NOISE: Record<string, string[]> = {
  bar: ["moderate", "loud"],
  restaurant: ["moderate", "quiet"],
  retail: ["quiet", "moderate"],
  cafe: ["quiet", "moderate"],
  experience: ["loud", "moderate"],
};

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function makeVenue(
  overrides: Partial<SeedVenue> & {
    name: string;
    category: SeedVenue["category"];
    city: string;
    market: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
    address: string;
  },
  seed: number,
): SeedVenue {
  const crowdScore = overrides.crowdScore ?? [22, 38, 51, 64, 72, 81, 88, 45, 59, 30][seed % 10];
  const crowdLevel: SeedVenue["crowdLevel"] =
    overrides.crowdLevel ?? (crowdScore >= 75 ? "packed" : crowdScore >= 45 ? "lively" : "open");
  const lineTrend: SeedVenue["lineTrend"] = overrides.lineTrend ?? pick(["rising", "falling", "steady"], seed);
  const noiseLevel = overrides.noiseLevel ?? pick(CATEGORY_NOISE[overrides.category] ?? ["moderate"], seed);
  return {
    rating: 4.2 + ((seed % 8) * 0.1),
    waitTimeMinutes: overrides.waitTimeMinutes ?? [0, 5, 10, 15, 20, 30, 45, 60][seed % 8],
    headcount: overrides.headcount ?? 20 + ((seed * 13) % 180),
    seatingOdds: overrides.seatingOdds ?? (crowdScore >= 75 ? "Low" : crowdScore >= 45 ? "Fair" : "High"),
    coverCost: overrides.coverCost ?? (overrides.category === "bar" || overrides.category === "experience" ? pick(["None", "$10 after 10pm", "$20 cover", "None"], seed) : "None"),
    bestTimeWindow: overrides.bestTimeWindow ?? pick(["5:30-6:30pm", "8-9pm weeknights", "2-4pm weekdays", "11pm-close", "Sunday brunch"], seed),
    bestFor: overrides.bestFor ?? ["Date Night"],
    operatorGapNote: overrides.operatorGapNote ?? "Front-of-house has no live view of the line once it passes the host stand.",
    peakPressureWindow: overrides.peakPressureWindow ?? "Thu-Sat 9pm-midnight",
    reservationSignal: overrides.reservationSignal ?? "Walk-ins usually seated within the posted wait",
    staffingSignal: overrides.staffingSignal ?? "Fully staffed for tonight's projected volume",
    dataSignalsTracked: overrides.dataSignalsTracked ?? ["Door count", "Table turns", "Community reports"],
    arrivalTips: overrides.arrivalTips ?? ["Arrive 20 minutes before the posted peak window for the shortest wait."],
    sourceLabel: overrides.sourceLabel ?? null,
    sourceUrl: overrides.sourceUrl ?? null,
    crowdScore,
    crowdLevel,
    lineTrend,
    noiseLevel,
    ...overrides,
  } as SeedVenue;
}

const venues: SeedVenue[] = [];
let s = 0;
const next = () => s++;

// ---------- CHICAGO (anchor market, 30+ venues) ----------
const chicago = (v: Partial<SeedVenue> & Pick<SeedVenue, "name" | "category" | "latitude" | "longitude" | "address">) =>
  venues.push(
    makeVenue(
      { city: "Chicago", market: "Chicago", region: "Illinois", country: "USA", ...v } as any,
      next(),
    ),
  );

chicago({ name: "The Aviary", category: "bar", latitude: 41.8898, longitude: -87.6483, address: "955 W Fulton Market, Chicago, IL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Aviary+Chicago" });
chicago({ name: "Kumiko", category: "bar", latitude: 41.8888, longitude: -87.6532, address: "630 W Lake St, Chicago, IL", bestFor: ["Date Night"] });
chicago({ name: "The Violet Hour", category: "bar", latitude: 41.9088, longitude: -87.6774, address: "1520 N Damen Ave, Chicago, IL", bestFor: ["Speakeasy", "Date Night", "Late-Night Food"] });
chicago({ name: "Green Mill Cocktail Lounge", category: "bar", latitude: 41.9686, longitude: -87.6605, address: "4802 N Broadway, Chicago, IL", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Green+Mill+Cocktail+Lounge" });
chicago({ name: "Kingston Mines", category: "bar", latitude: 41.9401, longitude: -87.6529, address: "2548 N Halsted St, Chicago, IL", bestFor: ["Live Music", "Late-Night Food"] });
chicago({ name: "Sportsman's Club", category: "bar", latitude: 41.9203, longitude: -87.6866, address: "948 N Western Ave, Chicago, IL", bestFor: ["No Wait"] });
chicago({ name: "Delilah's", category: "bar", latitude: 41.9198, longitude: -87.6534, address: "2771 N Lincoln Ave, Chicago, IL", bestFor: ["Late-Night Food"] });
chicago({ name: "三 Sanshi Izakaya", category: "bar", latitude: 41.9077, longitude: -87.6763, address: "1737 N Milwaukee Ave, Chicago, IL", bestFor: ["Date Night"] });
chicago({ name: "Alinea", category: "restaurant", latitude: 41.9146, longitude: -87.6376, address: "1723 N Halsted St, Chicago, IL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alinea+Chicago" });
chicago({ name: "Girl & the Goat", category: "restaurant", latitude: 41.8845, longitude: -87.6485, address: "809 W Randolph St, Chicago, IL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Girl+and+the+Goat+Chicago" });
chicago({ name: "Au Cheval", category: "restaurant", latitude: 41.8848, longitude: -87.6469, address: "800 W Randolph St, Chicago, IL", bestFor: ["Late-Night Food"] });
chicago({ name: "Portillo's Hot Dogs", category: "restaurant", latitude: 41.8917, longitude: -87.6274, address: "100 W Ontario St, Chicago, IL", bestFor: ["No Wait", "Late-Night Food"] });
chicago({ name: "Lou Malnati's Pizzeria", category: "restaurant", latitude: 41.8902, longitude: -87.6324, address: "439 N Wells St, Chicago, IL", bestFor: ["Late-Night Food"] });
chicago({ name: "Pequod's Pizza", category: "restaurant", latitude: 41.9218, longitude: -87.6644, address: "2207 N Clybourn Ave, Chicago, IL", bestFor: ["Late-Night Food"] });
chicago({ name: "The Purple Pig", category: "restaurant", latitude: 41.8917, longitude: -87.6255, address: "500 N Michigan Ave, Chicago, IL", bestFor: ["Date Night", "Patio Energy"] });
chicago({ name: "RPM Italian", category: "restaurant", latitude: 41.8919, longitude: -87.6299, address: "52 W Illinois St, Chicago, IL", bestFor: ["Date Night"] });
chicago({ name: "Smyth", category: "restaurant", latitude: 41.8656, longitude: -87.6538, address: "177 N Ada St, Chicago, IL", bestFor: ["Date Night"] });
chicago({ name: "Wildberry Pancakes and Cafe", category: "cafe", latitude: 41.8859, longitude: -87.6278, address: "130 E Randolph St, Chicago, IL", bestFor: ["No Wait"] });
chicago({ name: "Intelligentsia Coffee", category: "cafe", latitude: 41.9106, longitude: -87.6355, address: "3123 N Broadway, Chicago, IL", bestFor: ["No Wait"] });
chicago({ name: "Sawada Coffee", category: "cafe", latitude: 41.8951, longitude: -87.6274, address: "112 W San Antonio St, Chicago, IL", bestFor: ["No Wait"] });
chicago({ name: "Metric Coffee Co.", category: "cafe", latitude: 41.8967, longitude: -87.6636, address: "1109 W Randolph St, Chicago, IL", bestFor: ["No Wait"] });
chicago({ name: "Colectivo Coffee West Loop", category: "cafe", latitude: 41.8836, longitude: -87.6497, address: "999 W Fulton Market, Chicago, IL", bestFor: ["Patio Energy"] });
chicago({ name: "Sidecar Coffee", category: "cafe", latitude: 41.9247, longitude: -87.6957, address: "1638 N Milwaukee Ave, Chicago, IL", bestFor: ["No Wait"] });
chicago({ name: "Fulton Market Coffee Bar", category: "cafe", latitude: 41.8863, longitude: -87.6544, address: "728 W Randolph St, Chicago, IL", bestFor: ["No Wait"] });
chicago({ name: "RSVP Gallery", category: "retail", latitude: 41.9101, longitude: -87.6539, address: "1753 N Damen Ave, Chicago, IL", bestFor: ["Retail Drop"] });
chicago({ name: "Notre Shop", category: "retail", latitude: 41.9095, longitude: -87.6768, address: "1653 N Milwaukee Ave, Chicago, IL", bestFor: ["Retail Drop"] });
chicago({ name: "Silver Room", category: "retail", latitude: 41.9556, longitude: -87.6607, address: "1506 E 53rd St, Chicago, IL", bestFor: ["Retail Drop"] });
chicago({ name: "Rotate Boutique", category: "retail", latitude: 41.9139, longitude: -87.6772, address: "1734 W Division St, Chicago, IL", bestFor: ["Retail Drop"] });
chicago({ name: "Second City", category: "experience", latitude: 41.9128, longitude: -87.6355, address: "1616 N Wells St, Chicago, IL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Second+City+Chicago" });
chicago({ name: "Sleeping Village", category: "experience", latitude: 41.9598, longitude: -87.6944, address: "3734 W Belmont Ave, Chicago, IL", bestFor: ["Live Music"] });
chicago({ name: "Thalia Hall", category: "experience", latitude: 41.8582, longitude: -87.6633, address: "1807 S Allport St, Chicago, IL", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Thalia+Hall+Chicago" });
chicago({ name: "SPIN Chicago", category: "experience", latitude: 41.8886, longitude: -87.6355, address: "343 N Dearborn St, Chicago, IL", bestFor: ["No Wait"] });

// ---------- OTHER MARKETS ----------
const market = (
  city: string,
  marketName: string,
  region: string,
  country: string,
  v: Partial<SeedVenue> & Pick<SeedVenue, "name" | "category" | "latitude" | "longitude" | "address">,
) => venues.push(makeVenue({ city, market: marketName, region, country, ...v } as any, next()));

// New York City
market("New York", "New York City", "New York", "USA", { name: "Double Chicken Please", category: "bar", latitude: 40.7217, longitude: -73.9925, address: "165 Orchard St, New York, NY", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Double+Chicken+Please+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Dante NYC", category: "bar", latitude: 40.7295, longitude: -74.0002, address: "79-81 MacDougal St, New York, NY", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Dante+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Katz's Delicatessen", category: "restaurant", latitude: 40.7223, longitude: -73.9874, address: "205 E Houston St, New York, NY", bestFor: ["Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Katz's+Delicatessen" });
market("New York", "New York City", "New York", "USA", { name: "Blue Bottle Coffee Chelsea", category: "cafe", latitude: 40.7440, longitude: -74.0015, address: "450 W 15th St, New York, NY", bestFor: ["No Wait"] });
market("New York", "New York City", "New York", "USA", { name: "Kith SoHo", category: "retail", latitude: 40.7237, longitude: -74.0027, address: "337 Lafayette St, New York, NY", bestFor: ["Retail Drop"] });
market("New York", "New York City", "New York", "USA", { name: "Blue Note Jazz Club", category: "experience", latitude: 40.7308, longitude: -74.0007, address: "131 W 3rd St, New York, NY", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Blue+Note+Jazz+Club" });

market("New York", "New York City", "New York", "USA", { name: "Please Don't Tell", category: "bar", latitude: 40.7272, longitude: -73.9840, address: "113 St Marks Pl, New York, NY", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Please+Don't+Tell+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Balthazar", category: "restaurant", latitude: 40.7226, longitude: -73.9982, address: "80 Spring St, New York, NY", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Balthazar+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Joe's Pizza", category: "restaurant", latitude: 40.7305, longitude: -74.0021, address: "7 Carmine St, New York, NY", bestFor: ["Late-Night Food", "No Wait"] });
market("New York", "New York City", "New York", "USA", { name: "Devoción Williamsburg", category: "cafe", latitude: 40.7146, longitude: -73.9613, address: "69 Grand St, Brooklyn, NY", bestFor: ["No Wait"] });
market("New York", "New York City", "New York", "USA", { name: "Aimé Leon Dore", category: "retail", latitude: 40.7218, longitude: -73.9973, address: "214 Mulberry St, New York, NY", bestFor: ["Retail Drop"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Aime+Leon+Dore+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Comedy Cellar", category: "experience", latitude: 40.7302, longitude: -74.0003, address: "117 MacDougal St, New York, NY", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Comedy+Cellar+NYC" });

// Los Angeles
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Kato", category: "restaurant", latitude: 34.0472, longitude: -118.3562, address: "777 S Alameda St, Los Angeles, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Kato+Los+Angeles" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Bar Pompette", category: "bar", latitude: 34.0631, longitude: -118.3383, address: "5042 York Blvd, Los Angeles, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bar+Pompette+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Grand Central Market", category: "restaurant", latitude: 34.0505, longitude: -118.2489, address: "317 S Broadway, Los Angeles, CA", bestFor: ["No Wait"] });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Verve Coffee Arts District", category: "cafe", latitude: 34.0384, longitude: -118.2331, address: "833 S Santa Fe Ave, Los Angeles, CA", bestFor: ["No Wait"] });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Union Los Angeles", category: "retail", latitude: 34.0784, longitude: -118.3617, address: "110 S La Brea Ave, Los Angeles, CA", bestFor: ["Retail Drop"] });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Hotel Cafe", category: "experience", latitude: 34.1012, longitude: -118.3269, address: "1623 1/2 N Cahuenga Blvd, Los Angeles, CA", bestFor: ["Live Music"] });

market("Los Angeles", "Los Angeles", "California", "USA", { name: "Death & Co LA", category: "bar", latitude: 34.0430, longitude: -118.2354, address: "810 E 3rd St, Los Angeles, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Death+and+Co+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Bestia", category: "restaurant", latitude: 34.0332, longitude: -118.2296, address: "2121 E 7th Pl, Los Angeles, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bestia+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Dinosaur Coffee", category: "cafe", latitude: 34.0870, longitude: -118.2769, address: "4334 Sunset Blvd, Los Angeles, CA", bestFor: ["No Wait"] });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Bodega Los Angeles", category: "retail", latitude: 34.0447, longitude: -118.2418, address: "826 E 3rd St, Los Angeles, CA", bestFor: ["Retail Drop"] });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "The Comedy Store", category: "experience", latitude: 34.0976, longitude: -118.3763, address: "8433 Sunset Blvd, West Hollywood, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Comedy+Store" });

// Toronto
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Bar Raval", category: "bar", latitude: 43.6551, longitude: -79.4132, address: "505 College St, Toronto, ON", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bar+Raval+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Published on Main", category: "restaurant", latitude: 43.6786, longitude: -79.2965, address: "1636 Danforth Ave, Toronto, ON", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Published+on+Main+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Pilot Coffee Roasters", category: "cafe", latitude: 43.6629, longitude: -79.4177, address: "50 Wade Ave, Toronto, ON", bestFor: ["No Wait"] });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Livestock", category: "retail", latitude: 43.6469, longitude: -79.3985, address: "155 Dalhousie St, Toronto, ON", bestFor: ["Retail Drop"] });

market("Toronto", "Toronto", "Ontario", "Canada", { name: "Civil Liberties", category: "bar", latitude: 43.6626, longitude: -79.4300, address: "878 Bloor St W, Toronto, ON", bestFor: ["Date Night"] });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Alo", category: "restaurant", latitude: 43.6488, longitude: -79.3963, address: "163 Spadina Ave, Toronto, ON", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alo+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Richmond Station", category: "restaurant", latitude: 43.6515, longitude: -79.3790, address: "1 Richmond St W, Toronto, ON", bestFor: ["No Wait"] });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Sam James Coffee Bar", category: "cafe", latitude: 43.6540, longitude: -79.4113, address: "297 Harbord St, Toronto, ON", bestFor: ["No Wait"] });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Horseshoe Tavern", category: "experience", latitude: 43.6491, longitude: -79.3963, address: "370 Queen St W, Toronto, ON", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Horseshoe+Tavern+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Reigning Champ", category: "retail", latitude: 43.6486, longitude: -79.3956, address: "430 Queen St W, Toronto, ON", bestFor: ["Retail Drop"] });

// Miami
market("Miami", "Miami", "Florida", "USA", { name: "Café La Trova", category: "bar", latitude: 25.7654, longitude: -80.2196, address: "971 SW 8th St, Miami, FL", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cafe+La+Trova+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Joe's Stone Crab", category: "restaurant", latitude: 25.7708, longitude: -80.1349, address: "11 Washington Ave, Miami Beach, FL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Joe's+Stone+Crab" });
market("Miami", "Miami", "Florida", "USA", { name: "Panther Coffee Wynwood", category: "cafe", latitude: 25.8009, longitude: -80.1994, address: "2390 NW 2nd Ave, Miami, FL", bestFor: ["No Wait"] });
market("Miami", "Miami", "Florida", "USA", { name: "Base World", category: "retail", latitude: 25.7997, longitude: -80.1996, address: "2000 N Miami Ave, Miami, FL", bestFor: ["Retail Drop"] });

market("Miami", "Miami", "Florida", "USA", { name: "Sweet Liberty", category: "bar", latitude: 25.7942, longitude: -80.1339, address: "237 20th St, Miami Beach, FL", bestFor: ["Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sweet+Liberty+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Broken Shaker", category: "bar", latitude: 25.8023, longitude: -80.1266, address: "2727 Indian Creek Dr, Miami Beach, FL", bestFor: ["Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Broken+Shaker+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Versailles Restaurant", category: "restaurant", latitude: 25.7650, longitude: -80.2521, address: "3555 SW 8th St, Miami, FL", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Versailles+Restaurant+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Zak the Baker", category: "cafe", latitude: 25.8035, longitude: -80.1997, address: "295 NW 26th St, Miami, FL", bestFor: ["No Wait"] });
market("Miami", "Miami", "Florida", "USA", { name: "UNKNWN", category: "retail", latitude: 25.7999, longitude: -80.1988, address: "261 NW 26th St, Miami, FL", bestFor: ["Retail Drop"] });
market("Miami", "Miami", "Florida", "USA", { name: "Ball & Chain", category: "experience", latitude: 25.7654, longitude: -80.2245, address: "1513 SW 8th St, Miami, FL", bestFor: ["Live Music", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ball+and+Chain+Miami" });

// Austin
market("Austin", "Austin", "Texas", "USA", { name: "Franklin Barbecue", category: "restaurant", latitude: 30.2701, longitude: -97.7313, address: "900 E 11th St, Austin, TX", bestFor: ["No Wait" ], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Franklin+Barbecue" });
market("Austin", "Austin", "Texas", "USA", { name: "Whisler's", category: "bar", latitude: 30.2564, longitude: -97.7291, address: "1816 E 6th St, Austin, TX", bestFor: ["Date Night"] });
market("Austin", "Austin", "Texas", "USA", { name: "Cuvee Coffee", category: "cafe", latitude: 30.2652, longitude: -97.7431, address: "2400 E Cesar Chavez St, Austin, TX", bestFor: ["No Wait"] });
market("Austin", "Austin", "Texas", "USA", { name: "Stag Provisions", category: "retail", latitude: 30.2685, longitude: -97.7432, address: "1423 S Congress Ave, Austin, TX", bestFor: ["Retail Drop"] });

market("Austin", "Austin", "Texas", "USA", { name: "The White Horse", category: "bar", latitude: 30.2624, longitude: -97.7222, address: "500 Comal St, Austin, TX", bestFor: ["Live Music", "Late-Night Food"] });
market("Austin", "Austin", "Texas", "USA", { name: "Uchi", category: "restaurant", latitude: 30.2570, longitude: -97.7620, address: "801 S Lamar Blvd, Austin, TX", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Uchi+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Veracruz All Natural", category: "restaurant", latitude: 30.2594, longitude: -97.7183, address: "2505 Webberville Rd, Austin, TX", bestFor: ["No Wait"] });
market("Austin", "Austin", "Texas", "USA", { name: "Houndstooth Coffee", category: "cafe", latitude: 30.2717, longitude: -97.7530, address: "401 Congress Ave, Austin, TX", bestFor: ["No Wait"] });
market("Austin", "Austin", "Texas", "USA", { name: "ByGeorge", category: "retail", latitude: 30.2699, longitude: -97.7508, address: "524 N Lamar Blvd, Austin, TX", bestFor: ["Retail Drop"] });
market("Austin", "Austin", "Texas", "USA", { name: "Continental Club", category: "experience", latitude: 30.2521, longitude: -97.7490, address: "1315 S Congress Ave, Austin, TX", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Continental+Club+Austin" });

// Nashville
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Robert's Western World", category: "bar", latitude: 36.1610, longitude: -86.7776, address: "416 Broadway, Nashville, TN", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Robert's+Western+World" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Husk Nashville", category: "restaurant", latitude: 36.1573, longitude: -86.7756, address: "37 Rutledge St, Nashville, TN", bestFor: ["Date Night"] });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Barista Parlor Golden Sound", category: "cafe", latitude: 36.1668, longitude: -86.7828, address: "610 Magazine St, Nashville, TN", bestFor: ["No Wait"] });

market("Nashville", "Nashville", "Tennessee", "USA", { name: "Attaboy Nashville", category: "bar", latitude: 36.1554, longitude: -86.7669, address: "8 McFerrin Ave, Nashville, TN", bestFor: ["Date Night"] });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "The Patterson House", category: "bar", latitude: 36.1502, longitude: -86.7854, address: "1711 Division St, Nashville, TN", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Patterson+House+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Hattie B's Hot Chicken", category: "restaurant", latitude: 36.1512, longitude: -86.7834, address: "112 19th Ave S, Nashville, TN", bestFor: ["Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Hattie+B's+Hot+Chicken+Midtown" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Crema Coffee", category: "cafe", latitude: 36.1531, longitude: -86.7699, address: "15 Hermitage Ave, Nashville, TN", bestFor: ["No Wait"] });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Imogene + Willie", category: "retail", latitude: 36.1287, longitude: -86.7897, address: "2601 12th Ave S, Nashville, TN", bestFor: ["Retail Drop"] });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "The Station Inn", category: "experience", latitude: 36.1519, longitude: -86.7833, address: "402 12th Ave S, Nashville, TN", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Station+Inn" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Ryman Auditorium", category: "experience", latitude: 36.1612, longitude: -86.7785, address: "116 5th Ave N, Nashville, TN", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ryman+Auditorium" });

// Seattle
market("Seattle", "Seattle", "Washington", "USA", { name: "Canon", category: "bar", latitude: 36 * 0 + 47.6142, longitude: -122.3212, address: "928 12th Ave, Seattle, WA", bestFor: ["Date Night"] });
market("Seattle", "Seattle", "Washington", "USA", { name: "The Original Starbucks", category: "cafe", latitude: 47.6089, longitude: -122.3416, address: "1912 Pike Pl, Seattle, WA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Original+Starbucks+Pike+Place" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Elliott's Oyster House", category: "restaurant", latitude: 47.6062, longitude: -122.3406, address: "1201 Alaskan Way, Seattle, WA", bestFor: ["Date Night", "Patio Energy"] });

market("Seattle", "Seattle", "Washington", "USA", { name: "Bathtub Gin & Co", category: "bar", latitude: 47.6135, longitude: -122.3460, address: "2205 2nd Ave, Seattle, WA", bestFor: ["Date Night"] });
market("Seattle", "Seattle", "Washington", "USA", { name: "Damn the Weather", category: "bar", latitude: 47.6017, longitude: -122.3343, address: "116 1st Ave S, Seattle, WA", bestFor: ["Late-Night Food"] });
market("Seattle", "Seattle", "Washington", "USA", { name: "The Walrus and the Carpenter", category: "restaurant", latitude: 47.6659, longitude: -122.3821, address: "4743 Ballard Ave NW, Seattle, WA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Walrus+and+the+Carpenter" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Un Bien", category: "restaurant", latitude: 47.6684, longitude: -122.4036, address: "7302 15th Ave NW, Seattle, WA", bestFor: ["No Wait", "Patio Energy"] });
market("Seattle", "Seattle", "Washington", "USA", { name: "Espresso Vivace", category: "cafe", latitude: 47.6212, longitude: -122.3210, address: "532 Broadway Ave E, Seattle, WA", bestFor: ["No Wait"] });
market("Seattle", "Seattle", "Washington", "USA", { name: "Ebbets Field Flannels", category: "retail", latitude: 47.5990, longitude: -122.3284, address: "119 S Jackson St, Seattle, WA", bestFor: ["Retail Drop"] });
market("Seattle", "Seattle", "Washington", "USA", { name: "The Crocodile", category: "experience", latitude: 47.6137, longitude: -122.3455, address: "2505 1st Ave, Seattle, WA", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Crocodile+Seattle" });

// San Francisco
market("San Francisco", "San Francisco", "California", "USA", { name: "Californios", category: "restaurant", latitude: 37.7620, longitude: -122.4144, address: "3115 22nd St, San Francisco, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Californios+San+Francisco" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Comstock Saloon", category: "bar", latitude: 37.7975, longitude: -122.4079, address: "155 Columbus Ave, San Francisco, CA", bestFor: ["Date Night"] });
market("San Francisco", "San Francisco", "California", "USA", { name: "Ritual Coffee Roasters", category: "cafe", latitude: 37.7565, longitude: -122.4210, address: "1026 Valencia St, San Francisco, CA", bestFor: ["No Wait"] });

market("San Francisco", "San Francisco", "California", "USA", { name: "Trick Dog", category: "bar", latitude: 37.7593, longitude: -122.4125, address: "3010 20th St, San Francisco, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Trick+Dog+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "True Laurel", category: "bar", latitude: 37.7635, longitude: -122.4098, address: "753 Alabama St, San Francisco, CA", bestFor: ["Date Night", "Late-Night Food"] });
market("San Francisco", "San Francisco", "California", "USA", { name: "Tartine Bakery", category: "cafe", latitude: 37.7614, longitude: -122.4241, address: "600 Guerrero St, San Francisco, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Tartine+Bakery+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "House of Prime Rib", category: "restaurant", latitude: 37.7931, longitude: -122.4227, address: "1906 Van Ness Ave, San Francisco, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=House+of+Prime+Rib" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Zuni Café", category: "restaurant", latitude: 37.7736, longitude: -122.4216, address: "1658 Market St, San Francisco, CA", bestFor: ["Date Night"] });
market("San Francisco", "San Francisco", "California", "USA", { name: "Heath Ceramics", category: "retail", latitude: 37.7663, longitude: -122.4212, address: "2900 18th St, San Francisco, CA", bestFor: ["Retail Drop"] });
market("San Francisco", "San Francisco", "California", "USA", { name: "The Fillmore", category: "experience", latitude: 37.7840, longitude: -122.4330, address: "1805 Geary Blvd, San Francisco, CA", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Fillmore+SF" });

// Boston
market("Boston", "Boston", "Massachusetts", "USA", { name: "Yvonne's", category: "bar", latitude: 42.3556, longitude: -71.0603, address: "2 Winter Pl, Boston, MA", bestFor: ["Date Night"] });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Neptune Oyster", category: "restaurant", latitude: 42.3636, longitude: -71.0546, address: "63 Salem St, Boston, MA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Neptune+Oyster" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Thinking Cup", category: "cafe", latitude: 42.3536, longitude: -71.0638, address: "165 Tremont St, Boston, MA", bestFor: ["No Wait"] });

market("Boston", "Boston", "Massachusetts", "USA", { name: "Drink", category: "bar", latitude: 42.3519, longitude: -71.0485, address: "348 Congress St, Boston, MA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Drink+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Offsuit", category: "bar", latitude: 42.3512, longitude: -71.0601, address: "5 Utica St, Boston, MA", bestFor: ["Date Night"] });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Toro", category: "restaurant", latitude: 42.3383, longitude: -71.0765, address: "1704 Washington St, Boston, MA", bestFor: ["Date Night", "Late-Night Food"] });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Sarma", category: "restaurant", latitude: 42.3796, longitude: -71.0997, address: "249 Pearl St, Somerville, MA", bestFor: ["Date Night"] });
market("Boston", "Boston", "Massachusetts", "USA", { name: "George Howell Coffee", category: "cafe", latitude: 42.3519, longitude: -71.0644, address: "505 Washington St, Boston, MA", bestFor: ["No Wait"] });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Bodega", category: "retail", latitude: 42.3486, longitude: -71.0857, address: "6 Clearway St, Boston, MA", bestFor: ["Retail Drop"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bodega+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Wally's Cafe Jazz Club", category: "experience", latitude: 42.3413, longitude: -71.0827, address: "427 Massachusetts Ave, Boston, MA", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Wally's+Cafe+Jazz+Club" });

// Washington DC
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Quill", category: "bar", latitude: 38.9089, longitude: -77.0374, address: "1200 16th St NW, Washington, DC", bestFor: ["Date Night"] });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Rose's Luxury", category: "restaurant", latitude: 38.8814, longitude: -76.9955, address: "717 8th St SE, Washington, DC", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Rose's+Luxury" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Compass Coffee", category: "cafe", latitude: 38.9047, longitude: -77.0163, address: "1701 14th St NW, Washington, DC", bestFor: ["No Wait"] });

market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Service Bar DC", category: "bar", latitude: 38.9172, longitude: -77.0311, address: "926-928 U St NW, Washington, DC", bestFor: ["Late-Night Food"] });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Columbia Room", category: "bar", latitude: 38.9060, longitude: -77.0217, address: "124 Blagden Alley NW, Washington, DC", bestFor: ["Date Night"] });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Le Diplomate", category: "restaurant", latitude: 38.9114, longitude: -77.0316, address: "1601 14th St NW, Washington, DC", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Le+Diplomate+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Ben's Chili Bowl", category: "restaurant", latitude: 38.9170, longitude: -77.0284, address: "1213 U St NW, Washington, DC", bestFor: ["Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ben's+Chili+Bowl" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "La Colombe Blagden Alley", category: "cafe", latitude: 38.9057, longitude: -77.0225, address: "924 Blagden Alley NW, Washington, DC", bestFor: ["No Wait"] });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Major DC", category: "retail", latitude: 38.9166, longitude: -77.0320, address: "1426 Wisconsin Ave NW, Washington, DC", bestFor: ["Retail Drop"] });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "9:30 Club", category: "experience", latitude: 38.9180, longitude: -77.0237, address: "815 V St NW, Washington, DC", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=9:30+Club+DC" });

// Vancouver
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Keefer Bar", category: "bar", latitude: 49.2807, longitude: -123.1030, address: "135 Keefer St, Vancouver, BC", bestFor: ["Date Night"] });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Kissa Tanto", category: "restaurant", latitude: 49.2803, longitude: -123.1077, address: "263 E Pender St, Vancouver, BC", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Kissa+Tanto" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "49th Parallel Coffee", category: "cafe", latitude: 49.2648, longitude: -123.1379, address: "2902 Main St, Vancouver, BC", bestFor: ["No Wait"] });

market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Diamond", category: "bar", latitude: 49.2837, longitude: -123.1043, address: "6 Powell St, Vancouver, BC", bestFor: ["Date Night"] });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Botanist", category: "bar", latitude: 49.2880, longitude: -123.1187, address: "1038 Canada Pl, Vancouver, BC", bestFor: ["Date Night"] });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Miku", category: "restaurant", latitude: 49.2871, longitude: -123.1131, address: "200 Granville St, Vancouver, BC", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Miku+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Phnom Penh", category: "restaurant", latitude: 49.2786, longitude: -123.0985, address: "244 E Georgia St, Vancouver, BC", bestFor: ["No Wait"] });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Revolver", category: "cafe", latitude: 49.2831, longitude: -123.1090, address: "325 Cambie St, Vancouver, BC", bestFor: ["No Wait"] });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Livestock Vancouver", category: "retail", latitude: 49.2830, longitude: -123.1088, address: "239 Abbott St, Vancouver, BC", bestFor: ["Retail Drop"] });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Commodore Ballroom", category: "experience", latitude: 49.2807, longitude: -123.1206, address: "868 Granville St, Vancouver, BC", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Commodore+Ballroom" });

// Mexico City
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Quetzal", category: "bar", latitude: 19.4194, longitude: -99.1667, address: "Colima 168, Roma Norte, Mexico City", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Quetzal+Bar+Mexico+City" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Contramar", category: "restaurant", latitude: 19.4174, longitude: -99.1677, address: "Durango 200, Roma Norte, Mexico City", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Contramar+Mexico+City" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Licorería Limantour", category: "bar", latitude: 19.4198, longitude: -99.1719, address: "Álvaro Obregón 106, Roma Norte, Mexico City", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Licoreria+Limantour" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Café Avellaneda", category: "cafe", latitude: 19.4126, longitude: -99.1721, address: "Zacatecas 126, Roma Norte, Mexico City", bestFor: ["No Wait"] });

market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Handshake Speakeasy", category: "bar", latitude: 19.4260, longitude: -99.1620, address: "Amberes 65, Juárez, Mexico City", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Handshake+Speakeasy" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Pujol", category: "restaurant", latitude: 19.4324, longitude: -99.1938, address: "Tennyson 133, Polanco, Mexico City", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Pujol+Mexico+City" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Rosetta", category: "restaurant", latitude: 19.4205, longitude: -99.1601, address: "Colima 166, Roma Norte, Mexico City", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Rosetta+Mexico+City" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Panadería Rosetta", category: "cafe", latitude: 19.4189, longitude: -99.1626, address: "Puebla 242, Roma Norte, Mexico City", bestFor: ["No Wait"] });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "180° Shop", category: "retail", latitude: 19.4197, longitude: -99.1615, address: "Colima 180, Roma Norte, Mexico City", bestFor: ["Retail Drop"] });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Parker & Lenox", category: "experience", latitude: 19.4297, longitude: -99.1568, address: "Milán 14, Juárez, Mexico City", bestFor: ["Live Music"] });

// ---------- SPEAKEASIES (hidden bars, tagged "Speakeasy") ----------
chicago({ name: "Milk Room", category: "bar", latitude: 41.8756, longitude: -87.6244, address: "12 S Michigan Ave, Chicago, IL", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Milk+Room+Chicago" });
chicago({ name: "The Drifter", category: "bar", latitude: 41.8891, longitude: -87.6350, address: "676 N Orleans St, Chicago, IL", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=The+Drifter+Chicago" });
market("New York", "New York City", "New York", "USA", { name: "Attaboy", category: "bar", latitude: 40.7189, longitude: -73.9917, address: "134 Eldridge St, New York, NY", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Attaboy+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Bathtub Gin", category: "bar", latitude: 40.7439, longitude: -74.0011, address: "132 9th Ave, New York, NY", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Bathtub+Gin+NYC" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Good Times at Davey Wayne's", category: "bar", latitude: 34.0910, longitude: -118.3247, address: "1611 N El Centro Ave, Los Angeles, CA", bestFor: ["Speakeasy", "Patio Energy"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Davey+Waynes+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Del Monte Speakeasy", category: "bar", latitude: 33.9880, longitude: -118.4695, address: "52 Windward Ave, Venice, CA", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Del+Monte+Speakeasy+Venice" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Cloak Bar", category: "bar", latitude: 43.6428, longitude: -79.3959, address: "488 Wellington St W, Toronto, ON", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Cloak+Bar+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Mahjong Bar", category: "bar", latitude: 43.6503, longitude: -79.4275, address: "1276 Dundas St W, Toronto, ON", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Mahjong+Bar+Toronto" });
market("Miami", "Miami", "Florida", "USA", { name: "Bodega Taqueria Speakeasy", category: "bar", latitude: 25.7936, longitude: -80.1405, address: "1220 16th St, Miami Beach, FL", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Bodega+Taqueria+Miami" });
market("Austin", "Austin", "Texas", "USA", { name: "Midnight Cowboy", category: "bar", latitude: 30.2670, longitude: -97.7404, address: "313 E 6th St, Austin, TX", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Midnight+Cowboy+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Firehouse Lounge", category: "bar", latitude: 30.2687, longitude: -97.7418, address: "605 Brazos St, Austin, TX", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Firehouse+Lounge+Austin" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Yvonne's", category: "bar", latitude: 42.3555, longitude: -71.0614, address: "2 Winter Pl, Boston, MA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Yvonnes+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "The Wig Shop", category: "bar", latitude: 42.3563, longitude: -71.0611, address: "27 Temple Pl, Boston, MA", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=The+Wig+Shop+Boston" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "The Fox Bar & Cocktail Club", category: "bar", latitude: 36.1965, longitude: -86.7423, address: "2905B Gallatin Pike, Nashville, TN", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Fox+Bar+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Attaboy Nashville", category: "bar", latitude: 36.1774, longitude: -86.7527, address: "8 McFerrin Ave, Nashville, TN", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Attaboy+Nashville" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Bourbon & Branch", category: "bar", latitude: 37.7864, longitude: -122.4130, address: "501 Jones St, San Francisco, CA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Bourbon+and+Branch+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Local Edition", category: "bar", latitude: 37.7877, longitude: -122.4033, address: "691 Market St, San Francisco, CA", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Local+Edition+SF" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Needle & Thread", category: "bar", latitude: 47.6135, longitude: -122.3167, address: "1406 12th Ave, Seattle, WA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Needle+and+Thread+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Deep Dive", category: "bar", latitude: 47.6158, longitude: -122.3391, address: "620 Lenora St, Seattle, WA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Deep+Dive+Seattle" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Key Party", category: "bar", latitude: 49.2643, longitude: -123.1007, address: "2303 Main St, Vancouver, BC", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Key+Party+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Laowai", category: "bar", latitude: 49.2789, longitude: -123.0979, address: "251 E Georgia St, Vancouver, BC", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Laowai+Vancouver" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "The Gibson", category: "bar", latitude: 38.9172, longitude: -77.0319, address: "2009 14th St NW, Washington, DC", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=The+Gibson+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Chicken + Whiskey", category: "bar", latitude: 38.9122, longitude: -77.0318, address: "1738 14th St NW, Washington, DC", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Chicken+and+Whiskey+DC" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Handshake Speakeasy", category: "bar", latitude: 19.4260, longitude: -99.1621, address: "Amberes 65, Juárez, Mexico City", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Handshake+Speakeasy+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Hanky Panky", category: "bar", latitude: 19.4247, longitude: -99.1580, address: "Turín 52, Juárez, Mexico City", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Hanky+Panky+CDMX" });

// ---------- DELIVERY-APP & LOCAL-GEM PICKS ----------
chicago({ name: "Au Cheval", category: "restaurant", latitude: 41.8846, longitude: -87.6479, address: "800 W Randolph St, Chicago, IL", bestFor: ["Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Au+Cheval+Chicago" });
chicago({ name: "Pequod's Pizza", category: "restaurant", latitude: 41.9218, longitude: -87.6644, address: "2207 N Clybourn Ave, Chicago, IL", bestFor: ["Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Pequods+Pizza+Chicago" });
chicago({ name: "Mr. Beef", category: "restaurant", latitude: 41.8926, longitude: -87.6341, address: "666 N Orleans St, Chicago, IL", bestFor: ["No Wait"], sourceLabel: "DoorDash favorite", sourceUrl: "https://www.doordash.com/store/search/?query=Mr+Beef+Chicago" });
market("New York", "New York City", "New York", "USA", { name: "Xi'an Famous Foods", category: "restaurant", latitude: 40.7288, longitude: -73.9880, address: "81 St Marks Pl, New York, NY", bestFor: ["No Wait"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=Xian+Famous+Foods" });
market("New York", "New York City", "New York", "USA", { name: "Prince Street Pizza", category: "restaurant", latitude: 40.7229, longitude: -73.9944, address: "27 Prince St, New York, NY", bestFor: ["Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Prince+Street+Pizza+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Mamoun's Falafel", category: "restaurant", latitude: 40.7297, longitude: -74.0007, address: "119 MacDougal St, New York, NY", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Grubhub favorite", sourceUrl: "https://www.grubhub.com/search?queryText=Mamouns+Falafel" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Howlin' Ray's", category: "restaurant", latitude: 34.0614, longitude: -118.2399, address: "727 N Broadway, Los Angeles, CA", bestFor: ["Patio Energy"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Howlin+Rays+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Sonoratown", category: "restaurant", latitude: 34.0407, longitude: -118.2468, address: "208 E 8th St, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Sonoratown+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Leo's Tacos Truck", category: "restaurant", latitude: 34.0466, longitude: -118.3449, address: "1515 S La Brea Ave, Los Angeles, CA", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=Leos+Tacos" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Pai Northern Thai Kitchen", category: "restaurant", latitude: 43.6480, longitude: -79.3881, address: "18 Duncan St, Toronto, ON", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Pai+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Banh Mi Boys", category: "restaurant", latitude: 43.6488, longitude: -79.3969, address: "392 Queen St W, Toronto, ON", bestFor: ["No Wait"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=Banh+Mi+Boys" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Seven Lives Tacos", category: "restaurant", latitude: 43.6544, longitude: -79.4004, address: "69 Kensington Ave, Toronto, ON", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Seven+Lives+Toronto" });
market("Miami", "Miami", "Florida", "USA", { name: "La Sandwicherie", category: "restaurant", latitude: 25.7869, longitude: -80.1320, address: "229 14th St, Miami Beach, FL", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=La+Sandwicherie+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "El Palacio de los Jugos", category: "restaurant", latitude: 25.7657, longitude: -80.3110, address: "5721 W Flagler St, Miami, FL", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=El+Palacio+de+los+Jugos" });
market("Miami", "Miami", "Florida", "USA", { name: "Coyo Taco", category: "restaurant", latitude: 25.8005, longitude: -80.1994, address: "2300 NW 2nd Ave, Miami, FL", bestFor: ["Late-Night Food"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=Coyo+Taco" });
market("Austin", "Austin", "Texas", "USA", { name: "Home Slice Pizza", category: "restaurant", latitude: 30.2521, longitude: -97.7546, address: "1415 S Congress Ave, Austin, TX", bestFor: ["Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Home+Slice+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Via 313 Pizza", category: "restaurant", latitude: 30.2669, longitude: -97.7404, address: "61 Rainey St, Austin, TX", bestFor: ["Late-Night Food"], sourceLabel: "DoorDash favorite", sourceUrl: "https://www.doordash.com/store/search/?query=Via+313" });
market("Austin", "Austin", "Texas", "USA", { name: "Cuantos Tacos", category: "restaurant", latitude: 30.2620, longitude: -97.7160, address: "1108 E 12th St, Austin, TX", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Cuantos+Tacos+Austin" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Santarpio's Pizza", category: "restaurant", latitude: 42.3722, longitude: -71.0367, address: "111 Chelsea St, Boston, MA", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Santarpios+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Anna's Taqueria", category: "restaurant", latitude: 42.3466, longitude: -71.1050, address: "1412 Beacon St, Brookline, MA", bestFor: ["No Wait"], sourceLabel: "Grubhub favorite", sourceUrl: "https://www.grubhub.com/search?queryText=Annas+Taqueria" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Mike & Patty's", category: "cafe", latitude: 42.3480, longitude: -71.0672, address: "12 Church St, Boston, MA", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Mike+and+Pattys+Boston" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Prince's Hot Chicken", category: "restaurant", latitude: 36.2530, longitude: -86.7133, address: "5814 Nolensville Pike, Nashville, TN", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Princes+Hot+Chicken" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Hattie B's Hot Chicken", category: "restaurant", latitude: 36.1512, longitude: -86.7972, address: "112 19th Ave S, Nashville, TN", bestFor: ["Late-Night Food"], sourceLabel: "DoorDash favorite", sourceUrl: "https://www.doordash.com/store/search/?query=Hattie+Bs" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Mas Tacos Por Favor", category: "restaurant", latitude: 36.1770, longitude: -86.7510, address: "732 McFerrin Ave, Nashville, TN", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Mas+Tacos+Nashville" });
market("San Francisco", "San Francisco", "California", "USA", { name: "El Farolito", category: "restaurant", latitude: 37.7525, longitude: -122.4181, address: "2779 Mission St, San Francisco, CA", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=El+Farolito+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Souvla", category: "restaurant", latitude: 37.7765, longitude: -122.4241, address: "517 Hayes St, San Francisco, CA", bestFor: ["No Wait"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=Souvla" });
market("San Francisco", "San Francisco", "California", "USA", { name: "House of Prime Rib", category: "restaurant", latitude: 37.7934, longitude: -122.4227, address: "1906 Van Ness Ave, San Francisco, CA", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=House+of+Prime+Rib" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Paseo Caribbean Food", category: "restaurant", latitude: 47.6592, longitude: -122.3500, address: "4225 Fremont Ave N, Seattle, WA", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Paseo+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Dick's Drive-In", category: "restaurant", latitude: 47.6614, longitude: -122.3253, address: "111 NE 45th St, Seattle, WA", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Dicks+Drive+In+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Un Bien", category: "restaurant", latitude: 47.6685, longitude: -122.3766, address: "7302 15th Ave NW, Seattle, WA", bestFor: ["Patio Energy"], sourceLabel: "DoorDash favorite", sourceUrl: "https://www.doordash.com/store/search/?query=Un+Bien" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Phnom Penh", category: "restaurant", latitude: 49.2786, longitude: -123.0985, address: "244 E Georgia St, Vancouver, BC", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Phnom+Penh+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Japadog", category: "restaurant", latitude: 49.2856, longitude: -123.1195, address: "530 Robson St, Vancouver, BC", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Japadog+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "DownLow Chicken Shack", category: "restaurant", latitude: 49.2810, longitude: -123.0670, address: "905 Commercial Dr, Vancouver, BC", bestFor: ["No Wait"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=DownLow+Chicken" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Ben's Chili Bowl", category: "restaurant", latitude: 38.9170, longitude: -77.0281, address: "1213 U St NW, Washington, DC", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Bens+Chili+Bowl" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Call Your Mother Deli", category: "cafe", latitude: 38.9298, longitude: -77.0237, address: "3301 Georgia Ave NW, Washington, DC", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Call+Your+Mother+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "El Sol Restaurante", category: "restaurant", latitude: 38.9060, longitude: -77.0311, address: "1227 11th St NW, Washington, DC", bestFor: ["No Wait"], sourceLabel: "Grubhub favorite", sourceUrl: "https://www.grubhub.com/search?queryText=El+Sol+DC" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Taquería Orinoco", category: "restaurant", latitude: 19.4204, longitude: -99.1630, address: "Av. Insurgentes Sur 253, Roma Norte, Mexico City", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=Taqueria+Orinoco" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "El Vilsito", category: "restaurant", latitude: 19.3853, longitude: -99.1737, address: "Av. Universidad 248, Narvarte, Mexico City", bestFor: ["Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=El+Vilsito+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Churrería El Moro", category: "cafe", latitude: 19.4326, longitude: -99.1400, address: "Eje Central Lázaro Cárdenas 42, Centro, Mexico City", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=El+Moro+CDMX" });

// ---------- SPEAKEASY EXPANSION (wave 2 — more hidden rooms per market) ----------
chicago({ name: "The Office", category: "bar", latitude: 41.8896, longitude: -87.6482, address: "955 W Fulton Market, Chicago, IL", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=The+Office+Chicago+speakeasy" });
chicago({ name: "Dorian's Through the Record Shop", category: "bar", latitude: 41.9103, longitude: -87.6770, address: "1939 W North Ave, Chicago, IL", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Dorians+Chicago" });
market("New York", "New York City", "New York", "USA", { name: "The Back Room", category: "bar", latitude: 40.7202, longitude: -73.9869, address: "102 Norfolk St, New York, NY", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=The+Back+Room+NYC" });
market("New York", "New York City", "New York", "USA", { name: "La Noxe", category: "bar", latitude: 40.7452, longitude: -73.9930, address: "315 7th Ave, New York, NY", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=La+Noxe+NYC" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Lock & Key", category: "bar", latitude: 34.0637, longitude: -118.3088, address: "239 S Vermont Ave, Los Angeles, CA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Lock+and+Key+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Break Room 86", category: "bar", latitude: 34.0619, longitude: -118.3016, address: "630 S Ardmore Ave, Los Angeles, CA", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Break+Room+86+LA" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Gift Shop", category: "bar", latitude: 43.6467, longitude: -79.4194, address: "89 Ossington Ave, Toronto, ON", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Gift+Shop+bar+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Vatican Gift Shop", category: "bar", latitude: 43.6552, longitude: -79.4108, address: "246 Ossington Ave, Toronto, ON", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Vatican+Gift+Shop+Toronto" });
market("Miami", "Miami", "Florida", "USA", { name: "Dante's HiFi", category: "bar", latitude: 25.8007, longitude: -80.1988, address: "519 NW 26th St, Miami, FL", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Dantes+HiFi+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Mama Tried", category: "bar", latitude: 25.7748, longitude: -80.1900, address: "207 NE 1st St, Miami, FL", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Mama+Tried+Miami" });
market("Austin", "Austin", "Texas", "USA", { name: "Garage", category: "bar", latitude: 30.2680, longitude: -97.7442, address: "503 Colorado St, Austin, TX", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Garage+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Small Victory", category: "bar", latitude: 30.2687, longitude: -97.7396, address: "108 E 7th St, Austin, TX", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Small+Victory+Austin" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Old Glory", category: "bar", latitude: 36.1420, longitude: -86.7996, address: "1200 Villa Pl, Nashville, TN", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Old+Glory+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Hidden Bar at Noelle", category: "bar", latitude: 36.1650, longitude: -86.7793, address: "200 4th Ave N, Nashville, TN", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Hidden+Bar+Noelle+Nashville" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Wilson & Wilson Detective Agency", category: "bar", latitude: 37.7865, longitude: -122.4132, address: "505 Jones St, San Francisco, CA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Wilson+and+Wilson+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Linden Room", category: "bar", latitude: 37.7765, longitude: -122.4233, address: "292 Linden St, San Francisco, CA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Linden+Room+SF" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Knee High Stocking Co.", category: "bar", latitude: 47.6138, longitude: -122.3266, address: "1356 E Olive Way, Seattle, WA", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Knee+High+Stocking+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Inside Passage", category: "bar", latitude: 47.6083, longitude: -122.3374, address: "1109 1st Ave, Seattle, WA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Inside+Passage+Seattle" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Hecate", category: "bar", latitude: 42.3489, longitude: -71.0851, address: "48 Gloucester St, Boston, MA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Hecate+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Backbar", category: "bar", latitude: 42.3798, longitude: -71.1008, address: "7 Sanborn Ct, Somerville, MA", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Backbar+Somerville" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Allegory", category: "bar", latitude: 38.9007, longitude: -77.0263, address: "1201 K St NW, Washington, DC", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Allegory+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Never Looked Better", category: "bar", latitude: 38.9166, longitude: -77.0254, address: "2214 14th St NW, Washington, DC", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Never+Looked+Better+DC" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Bagheera", category: "bar", latitude: 49.2837, longitude: -123.1207, address: "801 W Georgia St, Vancouver, BC", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Bagheera+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Narrow Lounge", category: "bar", latitude: 49.2640, longitude: -123.0995, address: "1898 Main St, Vancouver, BC", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Narrow+Lounge+Vancouver" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Jules Basement", category: "bar", latitude: 19.4340, longitude: -99.1870, address: "Julio Verne 93, Polanco, Mexico City", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Jules+Basement+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Xaman Bar", category: "bar", latitude: 19.4266, longitude: -99.1610, address: "Copenhague 6, Juárez, Mexico City", bestFor: ["Speakeasy", "Live Music"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Xaman+Bar+CDMX" });

// ---------- EXPANSION WAVE 2 (more venues across every market) ----------
chicago({ name: "Bavette's Bar & Boeuf", category: "restaurant", latitude: 41.8916, longitude: -87.6337, address: "218 W Kinzie St, Chicago, IL", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Bavettes+Chicago" });
chicago({ name: "Kasama", category: "restaurant", latitude: 41.8996, longitude: -87.6871, address: "1001 N Winchester Ave, Chicago, IL", bestFor: ["Date Night", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Kasama+Chicago" });
chicago({ name: "Big Star", category: "bar", latitude: 41.9091, longitude: -87.6772, address: "1531 N Damen Ave, Chicago, IL", bestFor: ["Patio Energy", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Big+Star+Chicago" });
chicago({ name: "Aba", category: "restaurant", latitude: 41.8855, longitude: -87.6479, address: "302 N Green St, Chicago, IL", bestFor: ["Patio Energy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Aba+Chicago" });
chicago({ name: "The Whistler", category: "bar", latitude: 41.9247, longitude: -87.7069, address: "2421 N Milwaukee Ave, Chicago, IL", bestFor: ["Live Music"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=The+Whistler+Chicago" });
market("New York", "New York City", "New York", "USA", { name: "Los Tacos No. 1", category: "restaurant", latitude: 40.7425, longitude: -74.0060, address: "75 9th Ave, New York, NY", bestFor: ["No Wait"], sourceLabel: "Uber Eats favorite", sourceUrl: "https://www.ubereats.com/search?q=Los+Tacos+No+1" });
market("New York", "New York City", "New York", "USA", { name: "Russ & Daughters Cafe", category: "cafe", latitude: 40.7190, longitude: -73.9903, address: "127 Orchard St, New York, NY", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Russ+and+Daughters+Cafe" });
market("New York", "New York City", "New York", "USA", { name: "Lucali", category: "restaurant", latitude: 40.6802, longitude: -74.0005, address: "575 Henry St, Brooklyn, NY", bestFor: ["Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Lucali+Brooklyn" });
market("New York", "New York City", "New York", "USA", { name: "The Django", category: "experience", latitude: 40.7168, longitude: -74.0064, address: "2 6th Ave, New York, NY", bestFor: ["Live Music", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Django+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Fish Cheeks", category: "restaurant", latitude: 40.7255, longitude: -73.9942, address: "55 Bond St, New York, NY", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Fish+Cheeks+NYC" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Guelaguetza", category: "restaurant", latitude: 34.0522, longitude: -118.3006, address: "3014 W Olympic Blvd, Los Angeles, CA", bestFor: ["Live Music", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Guelaguetza+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "République", category: "cafe", latitude: 34.0625, longitude: -118.3441, address: "624 S La Brea Ave, Los Angeles, CA", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Republique+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Courage Bagels", category: "cafe", latitude: 34.0770, longitude: -118.2606, address: "777 N Virgil Ave, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Courage+Bagels+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Genghis Cohen", category: "experience", latitude: 34.0837, longitude: -118.3517, address: "740 N Fairfax Ave, Los Angeles, CA", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Genghis+Cohen+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Pizzeria Mozza", category: "restaurant", latitude: 34.0838, longitude: -118.3405, address: "641 N Highland Ave, Los Angeles, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Pizzeria+Mozza+LA" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Grey Gardens", category: "restaurant", latitude: 43.6547, longitude: -79.4025, address: "199 Augusta Ave, Toronto, ON", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Grey+Gardens+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Bar Isabel", category: "restaurant", latitude: 43.6549, longitude: -79.4204, address: "797 College St, Toronto, ON", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bar+Isabel+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Rol San", category: "restaurant", latitude: 43.6529, longitude: -79.3987, address: "323 Spadina Ave, Toronto, ON", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Rol+San+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Sneaky Dee's", category: "bar", latitude: 43.6564, longitude: -79.4067, address: "431 College St, Toronto, ON", bestFor: ["Late-Night Food", "Live Music"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Sneaky+Dees+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Balzac's Coffee Distillery", category: "cafe", latitude: 43.6503, longitude: -79.3596, address: "1 Trinity St, Toronto, ON", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Balzacs+Distillery+Toronto" });
market("Miami", "Miami", "Florida", "USA", { name: "Mandolin Aegean Bistro", category: "restaurant", latitude: 25.8137, longitude: -80.1918, address: "4312 NE 2nd Ave, Miami, FL", bestFor: ["Patio Energy", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Mandolin+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "KYU", category: "restaurant", latitude: 25.8000, longitude: -80.1990, address: "251 NW 25th St, Miami, FL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=KYU+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Lagniappe", category: "bar", latitude: 25.8093, longitude: -80.1897, address: "3425 NE 2nd Ave, Miami, FL", bestFor: ["Live Music", "Patio Energy"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Lagniappe+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "All Day", category: "cafe", latitude: 25.7846, longitude: -80.1935, address: "1035 N Miami Ave, Miami, FL", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=All+Day+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Supply & Advise", category: "retail", latitude: 25.7738, longitude: -80.1918, address: "223 SE 1st St, Miami, FL", bestFor: ["Retail Drop"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Supply+and+Advise+Miami" });
market("Austin", "Austin", "Texas", "USA", { name: "Loro", category: "restaurant", latitude: 30.2465, longitude: -97.7697, address: "2115 S Lamar Blvd, Austin, TX", bestFor: ["Patio Energy"], sourceLabel: "DoorDash favorite", sourceUrl: "https://www.doordash.com/store/search/?query=Loro+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Suerte", category: "restaurant", latitude: 30.2609, longitude: -97.7194, address: "1800 E 6th St, Austin, TX", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Suerte+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Nickel City", category: "bar", latitude: 30.2621, longitude: -97.7228, address: "1133 E 11th St, Austin, TX", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Nickel+City+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Mozart's Coffee Roasters", category: "cafe", latitude: 30.2934, longitude: -97.7842, address: "3825 Lake Austin Blvd, Austin, TX", bestFor: ["Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mozarts+Coffee+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Waterloo Records", category: "retail", latitude: 30.2712, longitude: -97.7534, address: "600 N Lamar Blvd, Austin, TX", bestFor: ["Retail Drop"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Waterloo+Records+Austin" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Arnold's Country Kitchen", category: "restaurant", latitude: 36.1497, longitude: -86.7789, address: "605 8th Ave S, Nashville, TN", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Arnolds+Country+Kitchen" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Folk", category: "restaurant", latitude: 36.1772, longitude: -86.7413, address: "823 Meridian St, Nashville, TN", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Folk+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Dino's", category: "bar", latitude: 36.1785, longitude: -86.7515, address: "411 Gallatin Ave, Nashville, TN", bestFor: ["Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Dinos+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Grimey's New & Preloved Music", category: "retail", latitude: 36.1772, longitude: -86.7500, address: "1060 E Trinity Ln, Nashville, TN", bestFor: ["Retail Drop"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Grimeys+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Frothy Monkey", category: "cafe", latitude: 36.1215, longitude: -86.7893, address: "2509 12th Ave S, Nashville, TN", bestFor: ["No Wait"], sourceLabel: "Grubhub favorite", sourceUrl: "https://www.grubhub.com/search?queryText=Frothy+Monkey" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Foreign Cinema", category: "restaurant", latitude: 37.7565, longitude: -122.4193, address: "2534 Mission St, San Francisco, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Foreign+Cinema+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Nopa", category: "restaurant", latitude: 37.7749, longitude: -122.4376, address: "560 Divisadero St, San Francisco, CA", bestFor: ["Late-Night Food", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Nopa+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Smuggler's Cove", category: "bar", latitude: 37.7793, longitude: -122.4232, address: "650 Gough St, San Francisco, CA", bestFor: ["Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Smugglers+Cove+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Sightglass Coffee", category: "cafe", latitude: 37.7768, longitude: -122.4086, address: "270 7th St, San Francisco, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sightglass+Coffee+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Amoeba Music", category: "retail", latitude: 37.7692, longitude: -122.4526, address: "1855 Haight St, San Francisco, CA", bestFor: ["Retail Drop"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Amoeba+Music+SF" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Tavolàta", category: "restaurant", latitude: 47.6152, longitude: -122.3474, address: "2323 2nd Ave, Seattle, WA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Tavolata+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Musang", category: "restaurant", latitude: 47.5580, longitude: -122.3145, address: "2524 Beacon Ave S, Seattle, WA", bestFor: ["Date Night"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Musang+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Zig Zag Café", category: "bar", latitude: 47.6087, longitude: -122.3419, address: "1501 Western Ave, Seattle, WA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Zig+Zag+Cafe+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Elm Coffee Roasters", category: "cafe", latitude: 47.6003, longitude: -122.3313, address: "240 2nd Ave S, Seattle, WA", bestFor: ["No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Elm+Coffee+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Neumos", category: "experience", latitude: 47.6141, longitude: -122.3197, address: "925 E Pike St, Seattle, WA", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Neumos+Seattle" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Giulia", category: "restaurant", latitude: 42.3782, longitude: -71.1191, address: "1682 Massachusetts Ave, Cambridge, MA", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Giulia+Cambridge" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Row 34", category: "restaurant", latitude: 42.3512, longitude: -71.0485, address: "383 Congress St, Boston, MA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Row+34+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Trillium Fort Point", category: "bar", latitude: 42.3505, longitude: -71.0488, address: "50 Thomson Pl, Boston, MA", bestFor: ["Patio Energy"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Trillium+Fort+Point" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Gracenote Coffee", category: "cafe", latitude: 42.3512, longitude: -71.0568, address: "108 Lincoln St, Boston, MA", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Gracenote+Coffee+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "The Sinclair", category: "experience", latitude: 42.3735, longitude: -71.1190, address: "52 Church St, Cambridge, MA", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Sinclair+Cambridge" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Maydan", category: "restaurant", latitude: 38.9188, longitude: -77.0310, address: "1346 Florida Ave NW, Washington, DC", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Maydan+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Thip Khao", category: "restaurant", latitude: 38.9297, longitude: -77.0329, address: "3462 14th St NW, Washington, DC", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Thip+Khao+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Dacha Beer Garden", category: "bar", latitude: 38.9126, longitude: -77.0225, address: "1600 7th St NW, Washington, DC", bestFor: ["Patio Energy"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Dacha+Beer+Garden+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "The Wydown", category: "cafe", latitude: 38.9155, longitude: -77.0318, address: "1924 14th St NW, Washington, DC", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=The+Wydown+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Songbyrd Music House", category: "experience", latitude: 38.9033, longitude: -76.9894, address: "540 Penn St NE, Washington, DC", bestFor: ["Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Songbyrd+DC" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "St. Lawrence", category: "restaurant", latitude: 49.2828, longitude: -123.0994, address: "269 Powell St, Vancouver, BC", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=St+Lawrence+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Anh and Chi", category: "restaurant", latitude: 49.2544, longitude: -123.1006, address: "3388 Main St, Vancouver, BC", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Anh+and+Chi+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Shameful Tiki Room", category: "bar", latitude: 49.2515, longitude: -123.1010, address: "4362 Main St, Vancouver, BC", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Shameful+Tiki+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Nemesis Coffee", category: "cafe", latitude: 49.2842, longitude: -123.1113, address: "302 W Hastings St, Vancouver, BC", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Nemesis+Coffee+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Neptoon Records", category: "retail", latitude: 49.2565, longitude: -123.1009, address: "3561 Main St, Vancouver, BC", bestFor: ["Retail Drop"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Neptoon+Records+Vancouver" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Máximo Bistrot", category: "restaurant", latitude: 19.4157, longitude: -99.1631, address: "Álvaro Obregón 65, Roma Norte, Mexico City", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Maximo+Bistrot+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Baltra Bar", category: "bar", latitude: 19.4115, longitude: -99.1707, address: "Iztaccihuatl 36D, Condesa, Mexico City", bestFor: ["Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Baltra+Bar+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Taquería Los Cocuyos", category: "restaurant", latitude: 19.4318, longitude: -99.1379, address: "Bolívar 57, Centro, Mexico City", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Los+Cocuyos+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Cardinal Casa de Café", category: "cafe", latitude: 19.4192, longitude: -99.1660, address: "Córdoba 132, Roma Norte, Mexico City", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Cardinal+Casa+de+Cafe" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Foro El Tejedor", category: "experience", latitude: 19.4171, longitude: -99.1662, address: "Álvaro Obregón 86, Roma Norte, Mexico City", bestFor: ["Live Music"], sourceLabel: "Local favorite", sourceUrl: "https://www.yelp.com/search?find_desc=Foro+El+Tejedor+CDMX" });

// ---------- PAST-EXPERIENCE COMMENTS ("The Wire") ----------
const AUTHORS = [
  "Maya R.", "Jordan T.", "Priya K.", "Devon S.", "Alexis M.", "Sam W.", "Nina P.", "Marcus L.",
  "Elena V.", "Chris B.", "Tasha J.", "Omar H.", "Rachel F.", "Diego C.", "Kayla N.", "Ben A.",
  "Zoe D.", "Andre G.", "Lena K.", "Tyler O.", "Sofia M.", "Jae P.", "Whitney C.", "Noah E.",
  "Camille B.", "Ravi S.", "Gabby T.", "Miles D.", "Harper L.", "Vince R.", "Ivy W.", "Leo F.",
];

const COMMENTS_BY_CATEGORY: Record<string, string[]> = {
  bar: [
    "Came through last Friday around 10 — line looked scary but moved in 15 minutes. Worth it.",
    "Bartender remembered my order from last month. Crowd was loud but the good kind of loud.",
    "Showed up at peak and couldn't get near the bar. Go before 9 if you actually want a seat.",
    "Happy hour here is criminally underrated. Had the whole corner booth to ourselves.",
    "DJ didn't start till 11 but the room was already packed by 10:30. Pace yourself.",
    "Doorman was chill, no cover before 10. Drinks came fast even with a full house.",
    "Was dead when we walked in at 8, completely flipped by 9:30. Wild swing.",
    "Patio was the move. Inside was a crush but outside we could actually hear each other.",
    "Waited 40 minutes on a Saturday. Great once inside but check the pulse before you go.",
    "Went on a Tuesday — half empty, full vibe. Weeknights are the secret here.",
    "The back room opened up around 11 and the whole night changed. Stick around.",
    "Solid pour, fair prices, zero attitude. My new default when friends are in town.",
    "Bachelorette party took over the bar around midnight — still had room to breathe by the windows.",
    "Bartender talked me through the whole menu unprompted. Left with three new favorites.",
    "Line moved way faster than it looked from the sidewalk. Don't judge it from outside.",
    "First round came out slow, everything after was on point. Kitchen fixed the backlog fast.",
  ],
  restaurant: [
    "Walked in at 6 sharp and got seated instantly. By 7 the wait was an hour. Timing is everything.",
    "The wait said 30 but it was more like 50. Food made up for it, mostly.",
    "Solo diner tip: the counter seats never have a wait. Ate like royalty in 20 minutes.",
    "Came for a birthday last weekend — they handled our party of 8 way better than expected.",
    "Kitchen was slammed but the host kept us posted the whole time. Respect.",
    "Lunch here is a completely different scene than dinner. Quiet, fast, same menu.",
    "Got the last two bar seats at 8:15 on a Friday. Felt like winning the lottery.",
    "They quoted 45 minutes and sat us in 25. Under-promise, over-deliver.",
    "Portions huge, line long, both deserved. Go early or go hungry.",
    "The patio at golden hour is the best table in the neighborhood, full stop.",
    "Service slowed way down when the rush hit around 7:30. Order everything up front.",
    "Sunday early evening is the sweet spot — no wait, kitchen still sharp.",
    "Took a call-ahead seating slot and still waited 10 minutes. Worth it over walking in cold.",
    "Table for two turned into a two-hour hang because nobody rushed us out. Rare these days.",
    "Host stand was slammed but the actual dining room felt calm the whole time.",
    "Went right when they opened — kitchen still warming up but zero wait either way.",
  ],
  cafe: [
    "Morning rush is real — 15 deep at 8:30. By 10 it's calm and all the seats free up.",
    "Best laptop corner in the city, but the outlets by the window are always taken by 9.",
    "Baristas move fast even when the line's out the door. Never waited more than 10.",
    "Weekend brunch line wraps the block. Weekday mornings? Walk right up.",
    "Got the last croissant at 11am on a Saturday. Learn from my near-miss.",
    "Quiet enough to actually take a call in the back room. Rare find.",
    "Afternoon lull hits around 2 — whole place to yourself plus the good pastries are half off.",
    "Wi-Fi solid, coffee better. Camped here for four hours and nobody blinked.",
    "The line looks long but it's mostly mobile orders. In-person moves quick.",
    "Cold brew sold out by noon last Sunday. They restock around 1 if you're patient.",
    "Study crowd takes over after 3pm on weekdays. Headphones recommended, it gets full.",
    "Ordered ahead on the app and it was ready before I found parking. Smooth system.",
  ],
  retail: [
    "Drop day was chaos — line at 9am for an 11am open. Restock Thursdays are way calmer.",
    "Staff actually knows the inventory. Found what three other shops couldn't.",
    "Weekday afternoons are dead quiet. Had the whole floor and staff to myself.",
    "Went during the weekend rush — checkout line was 20 minutes. Weekday lunch is the move.",
    "They held an item for me for two hours past closing pickup time. Real ones.",
    "New arrivals hit the floor Friday mornings. By Saturday afternoon the good sizes are gone.",
    "Browsing pressure level: zero. Stayed an hour, bought nothing, still felt welcome.",
    "Sale rack in the back turns over every Tuesday. That's all I'm saying.",
    "Busy but organized — even packed it never felt like a scrum.",
    "Called ahead to check stock and they actually picked up. Saved me a wasted trip.",
    "Line was mostly resellers at open. Regular shoppers, come back around noon instead.",
    "Staff pulled my size from the back without me even asking. That's the whole pitch.",
  ],
  experience: [
    "Doors said 8, real crowd showed at 9:30. Openers deserved better — and you get the rail.",
    "Sold-out show but the floor never felt dangerous-packed. Well run room.",
    "Sound was crisp even at the back bar. No bad spot in the house.",
    "Line for coat check longer than the line for drinks. Travel light.",
    "Went on a whim on a Wednesday — half full, all energy. Weeknight shows are underrated.",
    "The balcony is 21+ and half empty most nights. Best kept secret in the building.",
    "Merch line was a mess at close. Hit it mid-set if you actually want the shirt.",
    "Got there at door time, front row, no fight. This city sleeps on early arrival.",
    "Bar service during the headliner was surprisingly fast. Two deep, max.",
    "Last call sneaks up fast here — 30 minutes before the encore. Plan accordingly.",
    "Doors-to-opener gap was long but the room filled steadily — never felt like a crush.",
    "Grabbed rail spot 20 minutes in. Security kept it civil even once it filled up.",
  ],
};

const SPEAKEASY_COMMENTS = [
  "Took us 10 minutes to find the door. Worth every second of confusion.",
  "Password was on their story that morning — do your homework and you walk right in.",
  "Waited 25 outside a fake storefront feeling ridiculous. Then the door opened. Magic.",
  "Tiny room, huge drinks. Get there at open or accept the wait.",
  "The bartender quizzed us on our order like a job interview. Passed. Incredible night.",
  "Don't roll deeper than four people — they will bounce big groups fast.",
  "Reservation dropped at noon, gone by 12:04. Set an alarm.",
  "Found it on the second try. Look for the unmarked door, not the neon.",
  "Quietest 1am drink in the city. Nobody yells in here and it's beautiful.",
  "The 'hidden' part is real — my date walked past it twice while I watched from inside.",
  "Cocktails take a while when it's full. Order two at once, thank me later.",
  "Cash only at the back bar. The ATM outside blows the whole cover story.",
  "Texted the number on the sign and got a reply in two minutes. Old-school but it works.",
  "Brought out-of-towners and they still talk about finding the door. Good party trick.",
];

// ---------- LIVE REPORTS ----------
const REPORTER_HANDLES = [
  "NightOwl99", "CrowdWatcher", "LineWatcherLIVE", "PulseChecker", "DoorScoutDC",
  "WaitTimeWes", "VibeRadar", "TheScoutingReport", "RealTimeRae", "CurbAlertKay",
  "OnTheGroundOG", "SceneSniffer", "FirstInLineFin", "BarometerBri", "FootTrafficFio",
  "LiveFromTheDoor", "QueueQueen", "HeatCheckHal", "GroundTruthGio", "PulsePingPat",
];

const VIBE_NOTES_BY_CATEGORY: Record<string, string[]> = {
  bar: [
    "Just walked past — line's moving steady, maybe 10 min max right now.",
    "Standing room only inside but bar service is still quick.",
    "Dead right now honestly, great time to swing by.",
    "Just got in, DJ's warming up and the floor's filling fast.",
    "Bouncer's checking IDs slow tonight, adds a few minutes at the door.",
  ],
  restaurant: [
    "Hostess just told me 20 min wait, patio opened up though.",
    "Kitchen's cranking, food's coming out fast even with the crowd.",
    "Just sat down, place is maybe half full right now.",
    "Wait board says 35 but it's moving quicker than that in person.",
    "Bar seats open right now if you don't mind eating there.",
  ],
  cafe: [
    "Line's out the door but it's mostly mobile pickups, moves fast.",
    "Quiet right now, plenty of tables free.",
    "Just ordered, maybe 5 min wait at the counter.",
    "Getting the afternoon rush right now, standing room only.",
    "Outlets are free by the window if you're coming to work.",
  ],
  retail: [
    "Just browsed through, floor's calm and staff are free to help.",
    "Checkout line's a bit long but moving.",
    "New drop just hit the floor, good energy right now.",
    "Pretty quiet in here at the moment, good time to shop.",
  ],
  experience: [
    "Doors just opened, line's moving quick into the room.",
    "Floor's filling up fast, opener's about to start.",
    "Still plenty of room up front right now.",
    "Bar line inside is short, drinks before it gets packed.",
  ],
};

const SPEAKEASY_VIBE_NOTES = [
  "Just knocked, door opened right away tonight — no wait.",
  "Small crowd right now, easiest I've seen it get in.",
  "Line's forming at the hidden door, maybe 15 min.",
  "Bartender says it's filling up fast, get here soon.",
];

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3_600_000);
}

async function seed() {
  console.log(`Seeding ${venues.length} venues...`);
  await db.delete(venuesTable);
  const inserted = await db
    .insert(venuesTable)
    .values(venues.map((v) => ({ ...v, isWatchlisted: false })))
    .returning({
      id: venuesTable.id,
      name: venuesTable.name,
      category: venuesTable.category,
      bestFor: venuesTable.bestFor,
      crowdLevel: venuesTable.crowdLevel,
      waitTimeMinutes: venuesTable.waitTimeMinutes,
    });

  const comments: (typeof commentsTable.$inferInsert)[] = [];
  inserted.forEach((v, i) => {
    const isSpeakeasy = (v.bestFor ?? []).includes("Speakeasy");
    const pool = isSpeakeasy
      ? SPEAKEASY_COMMENTS
      : (COMMENTS_BY_CATEGORY[v.category] ?? COMMENTS_BY_CATEGORY.bar);
    const count = 3 + ((i * 7) % 4); // 3-6 comments per venue
    for (let c = 0; c < count; c++) {
      comments.push({
        venueId: v.id,
        authorName: AUTHORS[(i * 11 + c * 17) % AUTHORS.length],
        message: pool[(i * 3 + c * 5) % pool.length],
        // Spread between ~6 hours and ~40 days ago
        createdAt: hoursAgo(6 + ((i * 13 + c * 101) % (24 * 40))),
      });
    }
  });
  for (let i = 0; i < comments.length; i += 500) {
    await db.insert(commentsTable).values(comments.slice(i, i + 500));
  }

  const reports: (typeof liveReportsTable.$inferInsert)[] = [];
  const CROWD_LEVELS = ["open", "lively", "packed"] as const;
  inserted.forEach((v, i) => {
    const isSpeakeasy = (v.bestFor ?? []).includes("Speakeasy");
    const notePool = isSpeakeasy
      ? SPEAKEASY_VIBE_NOTES
      : (VIBE_NOTES_BY_CATEGORY[v.category] ?? VIBE_NOTES_BY_CATEGORY.bar);
    const count = 1 + ((i * 5) % 3); // 1-3 live reports per venue
    for (let r = 0; r < count; r++) {
      // Mostly mirror the venue's current crowd level, occasionally drift to simulate change over time
      const drift = (i * 19 + r * 31) % 10;
      const crowdLevel = drift < 8 ? v.crowdLevel : CROWD_LEVELS[(i + r) % CROWD_LEVELS.length];
      const waitJitter = ((i * 3 + r * 7) % 11) - 5; // +/- 5 minutes
      const waitTimeMinutes = Math.max(0, v.waitTimeMinutes + waitJitter);
      reports.push({
        venueId: v.id,
        reporterName: REPORTER_HANDLES[(i * 7 + r * 13) % REPORTER_HANDLES.length],
        crowdLevel,
        waitTimeMinutes,
        vibeNote: notePool[(i * 5 + r * 3) % notePool.length],
        // Spread between just now and ~10 hours ago, so the feed reads as genuinely live
        createdAt: hoursAgo((i * 7 + r * 41) % 10),
      });
    }
  });
  for (let i = 0; i < reports.length; i += 500) {
    await db.insert(liveReportsTable).values(reports.slice(i, i + 500));
  }

  console.log(
    `Done. Seeded ${inserted.length} venues, ${comments.length} comments, and ${reports.length} live reports.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
