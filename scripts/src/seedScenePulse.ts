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
    contactEmail: overrides.contactEmail ?? null,
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

// ---------- INTERACTIVE BARS (pool tables, shuffleboard, darts, bar games) ----------
chicago({ name: "The Break Room Chicago", category: "bar", latitude: 41.8978, longitude: -87.6467, address: "1756 W Lake St, Chicago, IL", bestFor: ["Pool Tables", "Bar Games"], crowdScore: 72, waitTimeMinutes: 10 });
chicago({ name: "Punch Bowl Social Chicago", category: "experience", latitude: 41.8832, longitude: -87.6484, address: "355 N Green St, Chicago, IL", bestFor: ["Shuffleboard", "Bar Games", "Late-Night Food"], crowdScore: 81, waitTimeMinutes: 20, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Punch+Bowl+Social+Chicago" });
chicago({ name: "Headquarters Beercade", category: "bar", latitude: 41.8916, longitude: -87.6364, address: "213 W Institute Pl, Chicago, IL", bestFor: ["Bar Games", "Pool Tables"], crowdScore: 65, waitTimeMinutes: 5 });
market("New York", "New York City", "New York", "USA", { name: "Slate NY", category: "bar", latitude: 40.7424, longitude: -73.9979, address: "54 W 21st St, New York, NY", bestFor: ["Pool Tables", "Bar Games"], crowdScore: 78, waitTimeMinutes: 15, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Slate+NY" });
market("New York", "New York City", "New York", "USA", { name: "Fat Cat", category: "bar", latitude: 40.7311, longitude: -74.0004, address: "75 Christopher St, New York, NY", bestFor: ["Pool Tables", "Shuffleboard", "Ping Pong", "Bar Games"], crowdScore: 70, waitTimeMinutes: 5, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Fat+Cat+NYC" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Emporium Arcade Bar LA", category: "bar", latitude: 34.1017, longitude: -118.3257, address: "6280 Hollywood Blvd, Los Angeles, CA", bestFor: ["Bar Games", "Pool Tables"], crowdScore: 68, waitTimeMinutes: 10 });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "EightyTwo", category: "bar", latitude: 34.0418, longitude: -118.2439, address: "707 E 4th Pl, Los Angeles, CA", bestFor: ["Shuffleboard", "Bar Games", "Pool Tables"], crowdScore: 74, waitTimeMinutes: 15, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=EightyTwo+DTLA" });
market("Miami", "Miami", "Florida", "USA", { name: "Gramps Miami", category: "bar", latitude: 25.8023, longitude: -80.1972, address: "176 NW 24th St, Miami, FL", bestFor: ["Shuffleboard", "Bar Games", "Patio Energy"], crowdScore: 76, waitTimeMinutes: 10, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Gramps+Miami" });
market("Austin", "Austin", "Texas", "USA", { name: "Pinballz Kingdom", category: "experience", latitude: 30.2645, longitude: -97.7468, address: "8940 Research Blvd, Austin, TX", bestFor: ["Bar Games", "Pool Tables"], crowdScore: 62, waitTimeMinutes: 0 });
market("Austin", "Austin", "Texas", "USA", { name: "The Crafthouse Gastropub", category: "bar", latitude: 30.2563, longitude: -97.7504, address: "1801 Barton Springs Rd, Austin, TX", bestFor: ["Shuffleboard", "Bar Games"], crowdScore: 69, waitTimeMinutes: 10 });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Pinewood Social", category: "experience", latitude: 36.1536, longitude: -86.7720, address: "33 Peabody St, Nashville, TN", bestFor: ["Shuffleboard", "Bar Games", "Patio Energy"], crowdScore: 83, waitTimeMinutes: 25, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Pinewood+Social+Nashville" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Raygun Lounge", category: "bar", latitude: 47.6134, longitude: -122.3200, address: "1121 E Pike St, Seattle, WA", bestFor: ["Bar Games", "Pool Tables"], crowdScore: 61, waitTimeMinutes: 0, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Raygun+Lounge+Seattle" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Brewcade", category: "bar", latitude: 37.7682, longitude: -122.4303, address: "2600 16th St, San Francisco, CA", bestFor: ["Bar Games", "Shuffleboard"], crowdScore: 73, waitTimeMinutes: 10, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Brewcade+SF" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Pawn & Pint", category: "bar", latitude: 42.3456, longitude: -71.0698, address: "75 Kneeland St, Boston, MA", bestFor: ["Bar Games", "Pool Tables", "Darts"], crowdScore: 66, waitTimeMinutes: 5 });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Punch Bowl Social DC", category: "experience", latitude: 38.9047, longitude: -77.0250, address: "1800 14th St NW, Washington, DC", bestFor: ["Shuffleboard", "Bar Games", "Pool Tables"], crowdScore: 79, waitTimeMinutes: 20, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Punch+Bowl+Social+DC" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "The Rec Room Toronto", category: "experience", latitude: 43.6419, longitude: -79.3914, address: "255 Bremner Blvd, Toronto, ON", bestFor: ["Shuffleboard", "Bar Games", "Pool Tables"], crowdScore: 80, waitTimeMinutes: 15, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Rec+Room+Toronto" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Storm Crow Tavern", category: "bar", latitude: 49.2636, longitude: -123.1028, address: "1305 Commercial Dr, Vancouver, BC", bestFor: ["Bar Games", "Darts", "Foosball"], crowdScore: 64, waitTimeMinutes: 5, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Storm+Crow+Tavern+Vancouver" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "La Cervecería de Barrio", category: "bar", latitude: 19.4185, longitude: -99.1713, address: "Sonora 11, Roma Norte, Mexico City", bestFor: ["Bar Games", "Pool Tables", "Patio Energy"], crowdScore: 71, waitTimeMinutes: 10, sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cerveceria+de+Barrio+CDMX" });

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

// ---------- LOS ANGELES EXPANSION: The Valley, Orange County, Malibu, more neighborhoods ----------

// The Valley (San Fernando Valley)
market("North Hollywood", "Los Angeles", "California", "USA", { name: "Idle Hour", category: "bar", latitude: 34.1688, longitude: -118.3785, address: "4824 Vineland Ave, North Hollywood, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Idle+Hour+North+Hollywood" });
market("North Hollywood", "Los Angeles", "California", "USA", { name: "The Federal Bar", category: "experience", latitude: 34.1694, longitude: -118.3830, address: "5303 Lankershim Blvd, North Hollywood, CA", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Federal+Bar+NoHo" });
market("Burbank", "Los Angeles", "California", "USA", { name: "Tinhorn Flats", category: "bar", latitude: 34.1831, longitude: -118.3075, address: "2623 W Magnolia Blvd, Burbank, CA", bestFor: ["Late-Night Food", "No Wait", "pool table"], sourceLabel: "Local favorite" });
market("Burbank", "Los Angeles", "California", "USA", { name: "Porto's Bakery Burbank", category: "cafe", latitude: 34.1805, longitude: -118.3082, address: "3614 W Magnolia Blvd, Burbank, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Porto's+Bakery+Burbank" });
market("Studio City", "Los Angeles", "California", "USA", { name: "Firefly", category: "restaurant", latitude: 34.1434, longitude: -118.3960, address: "11720 Ventura Blvd, Studio City, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Firefly+Studio+City" });
market("Studio City", "Los Angeles", "California", "USA", { name: "Sushi Yuzu", category: "restaurant", latitude: 34.1455, longitude: -118.3987, address: "11940 Ventura Blvd, Studio City, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick" });
market("Sherman Oaks", "Los Angeles", "California", "USA", { name: "The Brass Monkey", category: "bar", latitude: 34.1508, longitude: -118.4496, address: "14705 Ventura Blvd, Sherman Oaks, CA", bestFor: ["Live Music", "Late-Night Food", "darts"], sourceLabel: "Local favorite" });
market("Sherman Oaks", "Los Angeles", "California", "USA", { name: "Max Restaurant", category: "restaurant", latitude: 34.1530, longitude: -118.4462, address: "13355 Ventura Blvd, Sherman Oaks, CA", bestFor: ["Date Night"], sourceLabel: "Yelp pick" });
market("Glendale", "Los Angeles", "California", "USA", { name: "Koko's Perch Bar & Grill", category: "bar", latitude: 34.1502, longitude: -118.2556, address: "400 W Glenoaks Blvd, Glendale, CA", bestFor: ["Patio Energy", "No Wait"], sourceLabel: "Local favorite" });
market("Glendale", "Los Angeles", "California", "USA", { name: "Porto's Bakery Glendale", category: "cafe", latitude: 34.1456, longitude: -118.2525, address: "315 N Brand Blvd, Glendale, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Porto's+Bakery+Glendale" });
market("Pasadena", "Los Angeles", "California", "USA", { name: "The Arbour", category: "bar", latitude: 34.1479, longitude: -118.1421, address: "527 S Lake Ave, Pasadena, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Yelp pick" });
market("Pasadena", "Los Angeles", "California", "USA", { name: "Bodega Wine Bar", category: "bar", latitude: 34.1473, longitude: -118.1512, address: "260 E Colorado Blvd, Pasadena, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Local favorite" });

// Malibu
market("Malibu", "Los Angeles", "California", "USA", { name: "Nobu Malibu", category: "restaurant", latitude: 34.0321, longitude: -118.6906, address: "22706 Pacific Coast Hwy, Malibu, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Nobu+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Geoffrey's Malibu", category: "restaurant", latitude: 34.0306, longitude: -118.7018, address: "27400 Pacific Coast Hwy, Malibu, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Geoffrey's+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Moonshadows", category: "restaurant", latitude: 34.0348, longitude: -118.6827, address: "20356 Pacific Coast Hwy, Malibu, CA", bestFor: ["Date Night", "Patio Energy", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Moonshadows+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Neptune's Net", category: "restaurant", latitude: 34.0488, longitude: -118.9326, address: "42505 Pacific Coast Hwy, Malibu, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Neptune's+Net+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Duke's Malibu", category: "restaurant", latitude: 34.0298, longitude: -118.7148, address: "21150 Pacific Coast Hwy, Malibu, CA", bestFor: ["Patio Energy", "Date Night", "Live Music"], sourceLabel: "Local favorite" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Malibu Farm Pier Cafe", category: "cafe", latitude: 34.0359, longitude: -118.6756, address: "23000 Pacific Coast Hwy, Malibu, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Malibu+Farm+Pier+Cafe" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Malibu Wines Safari", category: "experience", latitude: 34.1015, longitude: -118.7357, address: "32111 Mulholland Hwy, Malibu, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Malibu+Wines+Safari" });

// Orange County — Newport Beach
market("Newport Beach", "Los Angeles", "California", "USA", { name: "The Cannery Restaurant", category: "restaurant", latitude: 33.6188, longitude: -117.9224, address: "3010 Lafayette Ave, Newport Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Cannery+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Muldoon's Irish Pub", category: "bar", latitude: 33.6161, longitude: -117.8997, address: "202 Newport Center Dr, Newport Beach, CA", bestFor: ["Live Music", "Late-Night Food", "pool table"], sourceLabel: "Local favorite" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Arc Butcher & Baker", category: "restaurant", latitude: 33.6147, longitude: -117.9252, address: "2930 Pacific Coast Hwy, Newport Beach, CA", bestFor: ["Date Night"], sourceLabel: "Yelp pick" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Bello by Slapfish", category: "restaurant", latitude: 33.6152, longitude: -117.9003, address: "124 Fashion Island Blvd, Newport Beach, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "The Winery Restaurant Newport", category: "restaurant", latitude: 33.6165, longitude: -117.8971, address: "3131 W Coast Hwy, Newport Beach, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing" });

// Orange County — Laguna Beach
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Las Brisas", category: "restaurant", latitude: 33.5444, longitude: -117.7853, address: "361 Cliff Dr, Laguna Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Las+Brisas+Laguna+Beach" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Broadway by Amar Santana", category: "restaurant", latitude: 33.5423, longitude: -117.7836, address: "328 Glenneyre St, Laguna Beach, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Broadway+by+Amar+Santana" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Mozambique", category: "bar", latitude: 33.5430, longitude: -117.7850, address: "1740 S Coast Hwy, Laguna Beach, CA", bestFor: ["Date Night", "Patio Energy", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mozambique+Laguna+Beach" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Laguna Beach Brew Co", category: "bar", latitude: 33.5398, longitude: -117.7826, address: "237 Ocean Ave, Laguna Beach, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "The Cliff Restaurant", category: "restaurant", latitude: 33.5416, longitude: -117.7842, address: "577 S Coast Hwy, Laguna Beach, CA", bestFor: ["Patio Energy", "Date Night"], sourceLabel: "Yelp pick" });

// Orange County — Anaheim / Santa Ana / Costa Mesa
market("Anaheim", "Los Angeles", "California", "USA", { name: "The Blind Rabbit", category: "bar", latitude: 33.8353, longitude: -117.9175, address: "440 S Anaheim Blvd, Anaheim, CA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Blind+Rabbit+Anaheim" });
market("Anaheim", "Los Angeles", "California", "USA", { name: "Congregation Ale House Anaheim", category: "bar", latitude: 33.8319, longitude: -117.9149, address: "202 W Lincoln Ave, Anaheim, CA", bestFor: ["No Wait", "pool table", "Late-Night Food"], sourceLabel: "Yelp pick" });
market("Santa Ana", "Los Angeles", "California", "USA", { name: "Chapter One: The Modern Local", category: "bar", latitude: 33.7455, longitude: -117.8678, address: "227 N Broadway, Santa Ana, CA", bestFor: ["Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Chapter+One+Santa+Ana" });
market("Santa Ana", "Los Angeles", "California", "USA", { name: "Memphis at the Santora", category: "restaurant", latitude: 33.7454, longitude: -117.8675, address: "201 N Broadway, Santa Ana, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick" });
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "The Lab Anti-Mall", category: "retail", latitude: 33.6895, longitude: -117.9075, address: "2930 Bristol St, Costa Mesa, CA", bestFor: ["Retail Drop", "No Wait"], sourceLabel: "Local favorite" });
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "Habana Restaurant", category: "restaurant", latitude: 33.6876, longitude: -117.9094, address: "2930 Bristol St, Costa Mesa, CA", bestFor: ["Date Night", "Late-Night Food", "Live Music"], sourceLabel: "Google Maps listing" });
market("Huntington Beach", "Los Angeles", "California", "USA", { name: "Huntington Beach Beer Co", category: "bar", latitude: 33.6595, longitude: -117.9988, address: "201 Main St, Huntington Beach, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
market("Huntington Beach", "Los Angeles", "California", "USA", { name: "Dukes Huntington Beach", category: "restaurant", latitude: 33.6574, longitude: -117.9994, address: "317 Pacific Coast Hwy, Huntington Beach, CA", bestFor: ["Patio Energy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Dukes+Huntington+Beach" });
market("Fullerton", "Los Angeles", "California", "USA", { name: "Slidebar Rock-N-Roll Kitchen", category: "experience", latitude: 33.8703, longitude: -117.9262, address: "122 E Commonwealth Ave, Fullerton, CA", bestFor: ["Live Music", "Late-Night Food", "shuffleboard"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Slidebar+Fullerton" });

// More LA proper — Silver Lake, Los Feliz, Echo Park, Highland Park, Koreatown
market("Los Angeles", "Los Angeles", "California", "USA", { name: "The Edendale", category: "bar", latitude: 34.0799, longitude: -118.2599, address: "2838 Rowena Ave, Los Angeles, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Edendale+Silver+Lake" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Bar Flores", category: "bar", latitude: 34.0915, longitude: -118.2809, address: "3207 W Sunset Blvd, Los Angeles, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bar+Flores+Silver+Lake" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Gold Bug Antiques", category: "retail", latitude: 34.0989, longitude: -118.1983, address: "22 W Hubbard St, Pasadena, CA", bestFor: ["Retail Drop", "No Wait"], sourceLabel: "Local favorite" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "La Cuevita", category: "bar", latitude: 34.1069, longitude: -118.1942, address: "5922 N Figueroa St, Los Angeles, CA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Local favorite" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "The Satellite", category: "experience", latitude: 34.0905, longitude: -118.2882, address: "1717 Silver Lake Blvd, Los Angeles, CA", bestFor: ["Live Music", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Satellite+Silver+Lake" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Taix French Restaurant", category: "restaurant", latitude: 34.0649, longitude: -118.2614, address: "1911 W Sunset Blvd, Los Angeles, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Local favorite" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Dayglow Coffee", category: "cafe", latitude: 34.0871, longitude: -118.2773, address: "4011 W Sunset Blvd, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Yelp pick" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Wax Paper Co.", category: "cafe", latitude: 34.1066, longitude: -118.1962, address: "5900 N Figueroa St, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Sonoratown", category: "restaurant", latitude: 34.0513, longitude: -118.2461, address: "208 E 8th St, Los Angeles, CA", bestFor: ["No Wait", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sonoratown+DTLA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "The Perch DTLA", category: "bar", latitude: 34.0485, longitude: -118.2511, address: "448 S Hill St, Los Angeles, CA", bestFor: ["Patio Energy", "Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Perch+DTLA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "R Bar Koreatown", category: "bar", latitude: 34.0620, longitude: -118.3057, address: "3331 W 8th St, Los Angeles, CA", bestFor: ["Late-Night Food", "No Wait", "pool table"], sourceLabel: "Local favorite" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Escala Koreatown", category: "experience", latitude: 34.0601, longitude: -118.3040, address: "3680 Wilshire Blvd, Los Angeles, CA", bestFor: ["Live Music", "Date Night", "Late-Night Food"], sourceLabel: "Yelp pick" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Genwa Korean BBQ", category: "restaurant", latitude: 34.0618, longitude: -118.3026, address: "5115 Wilshire Blvd, Los Angeles, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Genwa+Korean+BBQ" });
market("West Hollywood", "Los Angeles", "California", "USA", { name: "EP & LP", category: "bar", latitude: 34.0838, longitude: -118.3700, address: "603 N La Peer Dr, West Hollywood, CA", bestFor: ["Patio Energy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=EP+LP+West+Hollywood" });
market("West Hollywood", "Los Angeles", "California", "USA", { name: "Employees Only LA", category: "bar", latitude: 34.0878, longitude: -118.3826, address: "9217 W Sunset Blvd, West Hollywood, CA", bestFor: ["Date Night", "Speakeasy", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Employees+Only+West+Hollywood" });
market("West Hollywood", "Los Angeles", "California", "USA", { name: "Laurel Hardware", category: "bar", latitude: 34.0871, longitude: -118.3682, address: "7984 Santa Monica Blvd, West Hollywood, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Local favorite" });
market("Culver City", "Los Angeles", "California", "USA", { name: "Citizen Public House", category: "bar", latitude: 34.0259, longitude: -118.3962, address: "9739 Culver Blvd, Culver City, CA", bestFor: ["Date Night", "No Wait", "darts"], sourceLabel: "Yelp pick" });
market("Culver City", "Los Angeles", "California", "USA", { name: "Destroyer", category: "cafe", latitude: 34.0249, longitude: -118.3975, address: "3578 Hayden Ave, Culver City, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Destroyer+Culver+City" });
market("Santa Monica", "Los Angeles", "California", "USA", { name: "The Bungalow", category: "bar", latitude: 34.0167, longitude: -118.4944, address: "101 Wilshire Blvd, Santa Monica, CA", bestFor: ["Patio Energy", "Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Bungalow+Santa+Monica" });
market("Santa Monica", "Los Angeles", "California", "USA", { name: "Fia Restaurant", category: "restaurant", latitude: 34.0111, longitude: -118.4920, address: "2454 Wilshire Blvd, Santa Monica, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Fia+Santa+Monica" });
market("Santa Monica", "Los Angeles", "California", "USA", { name: "Dogtown Coffee", category: "cafe", latitude: 34.0098, longitude: -118.4838, address: "2003 Main St, Santa Monica, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
market("Venice", "Los Angeles", "California", "USA", { name: "Gjusta Bakery", category: "cafe", latitude: 33.9934, longitude: -118.4655, address: "320 Sunset Ave, Venice, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Gjusta+Venice" });
market("Venice", "Los Angeles", "California", "USA", { name: "Townhouse and Del Monte Speakeasy", category: "bar", latitude: 33.9904, longitude: -118.4736, address: "52 Windward Ave, Venice, CA", bestFor: ["Speakeasy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Townhouse+Venice+CA" });
market("Venice", "Los Angeles", "California", "USA", { name: "The Roosterfish", category: "bar", latitude: 33.9881, longitude: -118.4697, address: "1302 Abbot Kinney Blvd, Venice, CA", bestFor: ["No Wait", "pool table"], sourceLabel: "Local favorite" });

// Jon & Vinny's — all three locations
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Jon & Vinny's Fairfax", category: "restaurant", latitude: 34.0781, longitude: -118.3616, address: "412 N Fairfax Ave, Los Angeles, CA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Jon+and+Vinny's+Fairfax" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Jon & Vinny's Brentwood", category: "restaurant", latitude: 34.0490, longitude: -118.4750, address: "11628 San Vicente Blvd, Los Angeles, CA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Jon+and+Vinny's+Brentwood" });
market("Studio City", "Los Angeles", "California", "USA", { name: "Jon & Vinny's Studio City", category: "restaurant", latitude: 34.1415, longitude: -118.3942, address: "11266 Ventura Blvd, Studio City, CA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Jon+and+Vinny's+Studio+City" });

// ---------- MALIBU & ORANGE COUNTY DEEP EXPANSION ----------

// Malibu — more
market("Malibu", "Los Angeles", "California", "USA", { name: "Gladstone's Malibu", category: "restaurant", latitude: 34.0445, longitude: -118.5380, address: "17300 Pacific Coast Hwy, Pacific Palisades, CA", bestFor: ["Patio Energy", "No Wait", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Gladstones+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Paradise Cove Beach Cafe", category: "restaurant", latitude: 34.0133, longitude: -118.7788, address: "28128 Pacific Coast Hwy, Malibu, CA", bestFor: ["Patio Energy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Paradise+Cove+Beach+Cafe" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Tra di Noi", category: "restaurant", latitude: 34.0362, longitude: -118.6802, address: "22706 Pacific Coast Hwy, Malibu, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Tra+di+Noi+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Taverna Tony", category: "restaurant", latitude: 34.0374, longitude: -118.6843, address: "23410 Civic Center Way, Malibu, CA", bestFor: ["Date Night", "Live Music", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Taverna+Tony+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "SandBar Malibu", category: "bar", latitude: 34.0323, longitude: -118.6882, address: "22969 Pacific Coast Hwy, Malibu, CA", bestFor: ["Patio Energy", "Late-Night Food", "Live Music"], sourceLabel: "Local favorite" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Vintage Grocers", category: "cafe", latitude: 34.0375, longitude: -118.6822, address: "3876 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Vintage+Grocers+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Café Habana Malibu", category: "restaurant", latitude: 34.0376, longitude: -118.6826, address: "3939 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cafe+Habana+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Malibu Pier Bar & Grill", category: "bar", latitude: 34.0362, longitude: -118.6769, address: "23000 Pacific Coast Hwy, Malibu, CA", bestFor: ["Patio Energy", "No Wait"], sourceLabel: "Local favorite" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Carbon Beach Club", category: "bar", latitude: 34.0319, longitude: -118.6901, address: "22878 Pacific Coast Hwy, Malibu, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Local favorite" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Little Buddha", category: "restaurant", latitude: 34.0361, longitude: -118.6800, address: "22706 Pacific Coast Hwy, Malibu, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Malibu Brewery", category: "bar", latitude: 34.0371, longitude: -118.6837, address: "23240 Civic Center Way, Malibu, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Soho Beach House Malibu", category: "experience", latitude: 34.0328, longitude: -118.6856, address: "21940 Pacific Coast Hwy, Malibu, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Soho+Beach+House+Malibu" });

// Malibu Country Mart (3835 Cross Creek Rd) — full tenant sweep
market("Malibu", "Los Angeles", "California", "USA", { name: "John's Garden", category: "cafe", latitude: 34.0373, longitude: -118.6819, address: "3835 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=John's+Garden+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Malibu Kitchen & Gourmet Country Store", category: "cafe", latitude: 34.0375, longitude: -118.6820, address: "3835 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Malibu+Kitchen+Country+Store" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Sunlife Organics Malibu", category: "cafe", latitude: 34.0372, longitude: -118.6817, address: "3835 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sunlife+Organics+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Lily's Coffee Shop", category: "cafe", latitude: 34.0374, longitude: -118.6822, address: "3835 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });
market("Malibu", "Los Angeles", "California", "USA", { name: "The Country Mart Organic Pharmacy", category: "experience", latitude: 34.0371, longitude: -118.6816, address: "3835 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });

// Malibu Lumber Yard (3939 Cross Creek Rd) — adjacent to Country Mart
market("Malibu", "Los Angeles", "California", "USA", { name: "Howdy's Malibu", category: "restaurant", latitude: 34.0377, longitude: -118.6831, address: "3939 Cross Creek Rd, Malibu, CA", bestFor: ["No Wait", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Howdy's+Malibu+Lumber+Yard" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Obicà Mozzarella Bar Malibu", category: "restaurant", latitude: 34.0376, longitude: -118.6829, address: "3939 Cross Creek Rd, Malibu, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Obica+Mozzarella+Bar+Malibu" });

// Cross Creek corridor & PCH near Pepperdine
market("Malibu", "Los Angeles", "California", "USA", { name: "Bui Sushi", category: "restaurant", latitude: 34.0369, longitude: -118.6841, address: "23410 Civic Center Way, Malibu, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bui+Sushi+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Coogies Beach Cafe", category: "restaurant", latitude: 34.0355, longitude: -118.6748, address: "23750 Pacific Coast Hwy, Malibu, CA", bestFor: ["Patio Energy", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Coogies+Beach+Cafe+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Malibu Seafood Fresh Fish Market & Patio", category: "restaurant", latitude: 34.0416, longitude: -118.7063, address: "25653 Pacific Coast Hwy, Malibu, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Malibu+Seafood+Fresh+Fish+Market" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Thai Dishes Malibu", category: "restaurant", latitude: 34.0396, longitude: -118.6597, address: "21537 Pacific Coast Hwy, Malibu, CA", bestFor: ["No Wait", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/biz/thai-dishes-malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Cholada Thai Beach Cuisine", category: "restaurant", latitude: 34.0419, longitude: -118.6567, address: "18763 Pacific Coast Hwy, Malibu, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cholada+Thai+Beach+Cuisine+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Kristy's Restaurant & Bar", category: "bar", latitude: 34.0371, longitude: -118.6835, address: "23823 Malibu Rd, Malibu, CA", bestFor: ["Date Night", "Late-Night Food", "Live Music"], sourceLabel: "Local favorite" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Reel Inn Malibu", category: "restaurant", latitude: 34.0412, longitude: -118.5814, address: "18661 Pacific Coast Hwy, Malibu, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Reel+Inn+Malibu" });
market("Malibu", "Los Angeles", "California", "USA", { name: "Trancas Country Market", category: "cafe", latitude: 34.0249, longitude: -118.8752, address: "30745 Pacific Coast Hwy, Malibu, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Trancas+Country+Market+Malibu" });

// Orange County — Newport Beach more
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Bear Flag Fish Company", category: "restaurant", latitude: 33.6072, longitude: -117.9176, address: "3421 Via Lido, Newport Beach, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bear+Flag+Fish+Company" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "The Fig & Olive Newport", category: "restaurant", latitude: 33.6157, longitude: -117.8990, address: "414 N Old Newport Blvd, Newport Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Fig+Olive+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Zinc Café Newport", category: "cafe", latitude: 33.6164, longitude: -117.8991, address: "3718 E Coast Hwy, Corona del Mar, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Sol Cucina", category: "restaurant", latitude: 33.6193, longitude: -117.9231, address: "251 E Pacific Coast Hwy, Newport Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Yelp pick" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Cappy's Café", category: "cafe", latitude: 33.6044, longitude: -117.9134, address: "5930 W Coast Hwy, Newport Beach, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });

// Orange County — Laguna Beach more
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Sapphire Laguna", category: "restaurant", latitude: 33.5423, longitude: -117.7837, address: "1200 S Coast Hwy, Laguna Beach, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sapphire+Laguna" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Selanne Steak Tavern", category: "restaurant", latitude: 33.5418, longitude: -117.7843, address: "1464 S Coast Hwy, Laguna Beach, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Selanne+Steak+Tavern" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Watermarc Restaurant", category: "restaurant", latitude: 33.5429, longitude: -117.7851, address: "448 S Coast Hwy, Laguna Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Yelp pick" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Zinc Café Laguna", category: "cafe", latitude: 33.5438, longitude: -117.7856, address: "350 Ocean Ave, Laguna Beach, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "The Rooftop Lounge Laguna Beach", category: "bar", latitude: 33.5431, longitude: -117.7848, address: "1289 S Coast Hwy, Laguna Beach, CA", bestFor: ["Patio Energy", "Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Rooftop+Lounge+Laguna+Beach" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "The Stand Natural Foods", category: "cafe", latitude: 33.5284, longitude: -117.7739, address: "30806 S Coast Hwy, Laguna Beach, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });

// Orange County — Dana Point
market("Dana Point", "Los Angeles", "California", "USA", { name: "Wind & Sea Restaurant", category: "restaurant", latitude: 33.4688, longitude: -117.7002, address: "34699 Golden Lantern St, Dana Point, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Wind+Sea+Dana+Point" });
market("Dana Point", "Los Angeles", "California", "USA", { name: "The Deck on Laguna Beach", category: "bar", latitude: 33.4714, longitude: -117.7096, address: "34549 Green Lantern St, Dana Point, CA", bestFor: ["Patio Energy", "Late-Night Food", "Live Music"], sourceLabel: "Yelp pick" });
market("Dana Point", "Los Angeles", "California", "USA", { name: "Cannons Seafood Grill", category: "restaurant", latitude: 33.4625, longitude: -117.7080, address: "34344 S St of the Golden Lantern, Dana Point, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Local favorite" });
market("Dana Point", "Los Angeles", "California", "USA", { name: "Lost Winds Brewing", category: "bar", latitude: 33.4668, longitude: -117.6972, address: "34443 PCH, Dana Point, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
market("Dana Point", "Los Angeles", "California", "USA", { name: "The Hive Dana Point", category: "experience", latitude: 33.4681, longitude: -117.6987, address: "24382 Del Prado, Dana Point, CA", bestFor: ["Live Music", "Date Night"], sourceLabel: "Local favorite" });

// Orange County — San Clemente
market("San Clemente", "Los Angeles", "California", "USA", { name: "The Fisherman's Restaurant and Bar", category: "restaurant", latitude: 33.4270, longitude: -117.6186, address: "611 Avenida Victoria, San Clemente, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Fisherman's+Restaurant+San+Clemente" });
market("San Clemente", "Los Angeles", "California", "USA", { name: "Cellar 67", category: "bar", latitude: 33.4268, longitude: -117.6155, address: "210 S El Camino Real, San Clemente, CA", bestFor: ["Speakeasy", "Date Night", "No Wait"], sourceLabel: "Local favorite" });
market("San Clemente", "Los Angeles", "California", "USA", { name: "Surfing Heritage & Culture Center", category: "experience", latitude: 33.4335, longitude: -117.6187, address: "110 Calle Iglesia, San Clemente, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });

// Orange County — Irvine
market("Irvine", "Los Angeles", "California", "USA", { name: "Eureka! Irvine", category: "restaurant", latitude: 33.6846, longitude: -117.8265, address: "2491 Park Ave, Tustin, CA", bestFor: ["Date Night", "No Wait", "shuffleboard"], sourceLabel: "Yelp pick" });
market("Irvine", "Los Angeles", "California", "USA", { name: "Sessions West Coast Deli Irvine", category: "cafe", latitude: 33.6762, longitude: -117.8296, address: "2700 Alton Pkwy, Irvine, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });
market("Irvine", "Los Angeles", "California", "USA", { name: "Unsung Brewing Co", category: "bar", latitude: 33.7109, longitude: -117.7997, address: "1 Glenn Curtiss, Tustin, CA", bestFor: ["No Wait", "Patio Energy", "game bar"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Unsung+Brewing+Tustin" });
market("Irvine", "Los Angeles", "California", "USA", { name: "Lazy Dog Restaurant & Bar", category: "restaurant", latitude: 33.6847, longitude: -117.8244, address: "2799 Park Ave, Tustin, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Yelp pick" });

// Orange County — Seal Beach
market("Seal Beach", "Los Angeles", "California", "USA", { name: "Walt's Wharf", category: "restaurant", latitude: 33.7403, longitude: -118.1044, address: "201 Main St, Seal Beach, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Walts+Wharf+Seal+Beach" });
market("Seal Beach", "Los Angeles", "California", "USA", { name: "The Hideout", category: "bar", latitude: 33.7411, longitude: -118.1049, address: "311 Main St, Seal Beach, CA", bestFor: ["No Wait", "pool table", "Late-Night Food"], sourceLabel: "Local favorite" });

// Orange County — San Juan Capistrano
market("San Juan Capistrano", "Los Angeles", "California", "USA", { name: "The Ramos House Café", category: "cafe", latitude: 33.5012, longitude: -117.6628, address: "31752 Los Rios St, San Juan Capistrano, CA", bestFor: ["No Wait", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ramos+House+Cafe" });
market("San Juan Capistrano", "Los Angeles", "California", "USA", { name: "Trabuco Oaks Steakhouse", category: "restaurant", latitude: 33.5673, longitude: -117.5793, address: "20782 Trabuco Oaks Dr, Trabuco Canyon, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Local favorite" });

// Orange County — Fullerton / Brea more
market("Fullerton", "Los Angeles", "California", "USA", { name: "Hopscotch Craft Beer & Whiskey", category: "bar", latitude: 33.8712, longitude: -117.9265, address: "118 W Commonwealth Ave, Fullerton, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick" });
market("Brea", "Los Angeles", "California", "USA", { name: "The Hive Brea", category: "experience", latitude: 33.9169, longitude: -117.9013, address: "1 Pointe Dr, Brea, CA", bestFor: ["game bar", "shuffleboard", "Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing" });

// ---------- EXPANDED VENUES ----------

// Chicago — game bars + speakeasies + more
chicago({ name: "Lost & Found", category: "bar", latitude: 41.9145, longitude: -87.6813, address: "3058 W Irving Park Rd, Chicago, IL", bestFor: ["shuffleboard", "bar game", "Date Night"], sourceLabel: "Local favorite" });
chicago({ name: "City Tap House River North", category: "bar", latitude: 41.8926, longitude: -87.6309, address: "340 N Wells St, Chicago, IL", bestFor: ["pool table", "game bar", "Patio Energy"], sourceLabel: "Yelp pick" });
chicago({ name: "The Wormhole Coffee", category: "cafe", latitude: 41.9038, longitude: -87.6798, address: "1462 N Milwaukee Ave, Chicago, IL", bestFor: ["No Wait"], sourceLabel: "Local favorite" });
chicago({ name: "Scofflaw", category: "bar", latitude: 41.9166, longitude: -87.6891, address: "3201 W Armitage Ave, Chicago, IL", bestFor: ["Date Night", "Speakeasy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Scofflaw+Chicago" });
chicago({ name: "The Milk Room", category: "bar", latitude: 41.8903, longitude: -87.6269, address: "12 S Michigan Ave, Chicago, IL", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Milk+Room+Chicago" });
chicago({ name: "Cindy's Rooftop", category: "bar", latitude: 41.8826, longitude: -87.6272, address: "12 S Michigan Ave, Chicago, IL", bestFor: ["Patio Energy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cindy's+Rooftop+Chicago" });
chicago({ name: "Old Crow Smokehouse", category: "restaurant", latitude: 41.8921, longitude: -87.6303, address: "149 W Kinzie St, Chicago, IL", bestFor: ["Late-Night Food", "Live Music"], sourceLabel: "Yelp pick" });
chicago({ name: "Revolution Brewing", category: "bar", latitude: 41.9142, longitude: -87.6810, address: "2323 N Milwaukee Ave, Chicago, IL", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Local favorite" });
chicago({ name: "Hogsalt Hospitality - Au Cheval Annex", category: "bar", latitude: 41.8854, longitude: -87.6481, address: "803 W Randolph St, Chicago, IL", bestFor: ["Late-Night Food"], sourceLabel: "Local favorite" });
chicago({ name: "The Berghoff", category: "restaurant", latitude: 41.8794, longitude: -87.6296, address: "17 W Adams St, Chicago, IL", bestFor: ["No Wait", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Berghoff+Chicago" });
chicago({ name: "Empty Bottle", category: "experience", latitude: 41.9035, longitude: -87.6844, address: "1035 N Western Ave, Chicago, IL", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Local favorite" });
chicago({ name: "Woodlawn Tap", category: "bar", latitude: 41.7833, longitude: -87.5966, address: "1172 E 55th St, Chicago, IL", bestFor: ["No Wait", "pool table"], sourceLabel: "Local favorite" });

// New York City — game bars + speakeasies + more
market("New York", "New York City", "New York", "USA", { name: "Fat Cat", category: "experience", latitude: 40.7317, longitude: -74.0025, address: "75 Christopher St, New York, NY", bestFor: ["Live Music", "pool table", "ping pong", "shuffleboard"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Fat+Cat+NYC" });
market("New York", "New York City", "New York", "USA", { name: "The Back Room", category: "bar", latitude: 40.7181, longitude: -73.9888, address: "102 Norfolk St, New York, NY", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Back+Room+NYC" });
market("New York", "New York City", "New York", "USA", { name: "The Campbell", category: "bar", latitude: 40.7527, longitude: -73.9762, address: "Grand Central Terminal, New York, NY", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Campbell+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Russ & Daughters Café", category: "restaurant", latitude: 40.7222, longitude: -73.9875, address: "127 Orchard St, New York, NY", bestFor: ["No Wait", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Russ+and+Daughters+Cafe" });
market("New York", "New York City", "New York", "USA", { name: "The Happiest Hour", category: "bar", latitude: 40.7368, longitude: -74.0005, address: "121 W 10th St, New York, NY", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Yelp pick" });
market("New York", "New York City", "New York", "USA", { name: "Lucien", category: "restaurant", latitude: 40.7243, longitude: -73.9834, address: "14 First Ave, New York, NY", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Local favorite" });
market("New York", "New York City", "New York", "USA", { name: "Rule of Thirds", category: "bar", latitude: 40.7196, longitude: -73.9581, address: "168 N 10th St, Brooklyn, NY", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Rule+of+Thirds+Brooklyn" });
market("New York", "New York City", "New York", "USA", { name: "Proletariat", category: "bar", latitude: 40.7272, longitude: -73.9837, address: "102 St Marks Pl, New York, NY", bestFor: ["No Wait"], sourceLabel: "Local favorite" });
market("New York", "New York City", "New York", "USA", { name: "Peculier Pub", category: "bar", latitude: 40.7305, longitude: -74.0012, address: "145 Bleecker St, New York, NY", bestFor: ["No Wait", "pool table"], sourceLabel: "Local favorite" });
market("New York", "New York City", "New York", "USA", { name: "The Standard Biergarten", category: "bar", latitude: 40.7416, longitude: -74.0076, address: "848 Washington St, New York, NY", bestFor: ["Patio Energy", "No Wait", "ping pong"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Standard+Biergarten+NYC" });

// Los Angeles — more bars, speakeasies, game bars
market("Los Angeles", "Los Angeles", "California", "USA", { name: "No Vacancy", category: "bar", latitude: 34.0981, longitude: -118.3398, address: "1727 N Hudson Ave, Los Angeles, CA", bestFor: ["Speakeasy", "Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=No+Vacancy+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "The Edison DTLA", category: "bar", latitude: 34.0493, longitude: -118.2484, address: "108 W 2nd St, Los Angeles, CA", bestFor: ["Speakeasy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Edison+DTLA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Good Housekeeping", category: "bar", latitude: 34.0957, longitude: -118.3301, address: "1739 N Vermont Ave, Los Angeles, CA", bestFor: ["Date Night", "pool table"], sourceLabel: "Local favorite" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Clifton's Republic", category: "bar", latitude: 34.0477, longitude: -118.2506, address: "648 S Broadway, Los Angeles, CA", bestFor: ["Date Night", "Live Music", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Clifton's+Republic+LA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Otium", category: "restaurant", latitude: 34.0530, longitude: -118.2507, address: "222 S Hope St, Los Angeles, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Yelp pick" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "ETA", category: "bar", latitude: 34.0968, longitude: -118.3287, address: "1642 N Las Palmas Ave, Los Angeles, CA", bestFor: ["Date Night", "darts", "game bar"], sourceLabel: "Local favorite" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Commissary", category: "restaurant", latitude: 34.0912, longitude: -118.3690, address: "8221 W Sunset Blvd, West Hollywood, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Mandrake Bar", category: "bar", latitude: 34.0099, longitude: -118.3879, address: "2692 La Cienega Blvd, Los Angeles, CA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Local favorite" });

// Toronto — more bars, speakeasies, game bars
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Cloak Bar", category: "bar", latitude: 43.6528, longitude: -79.3764, address: "24 Duncan St, Toronto, ON", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "The Rec Room", category: "experience", latitude: 43.6424, longitude: -79.3815, address: "255 Bremner Blvd, Toronto, ON", bestFor: ["game bar", "shuffleboard", "ping pong", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Rec+Room+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Fynn's of Temple Bar", category: "bar", latitude: 43.6503, longitude: -79.3753, address: "119 John St, Toronto, ON", bestFor: ["pool table", "Live Music", "Late-Night Food"], sourceLabel: "Yelp pick" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Buca Osteria", category: "restaurant", latitude: 43.6477, longitude: -79.4022, address: "604 King St W, Toronto, ON", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Buca+King+Street+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Kensington Brewing Co", category: "bar", latitude: 43.6545, longitude: -79.4040, address: "299 Augusta Ave, Toronto, ON", bestFor: ["Patio Energy", "No Wait"], sourceLabel: "Local favorite" });

// Miami — more bars, speakeasies, game bars
market("Miami", "Miami", "Florida", "USA", { name: "The Broken Anchor", category: "bar", latitude: 25.7913, longitude: -80.1908, address: "3218 NW 7th St, Miami, FL", bestFor: ["pool table", "darts", "Late-Night Food"], sourceLabel: "Local favorite" });
market("Miami", "Miami", "Florida", "USA", { name: "The Regent Cocktail Club", category: "bar", latitude: 25.7951, longitude: -80.1295, address: "1690 Collins Ave, Miami Beach, FL", bestFor: ["Speakeasy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Regent+Cocktail+Club+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Coyo Taco", category: "restaurant", latitude: 25.7994, longitude: -80.1999, address: "2300 NW 2nd Ave, Miami, FL", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Coyo+Taco+Wynwood" });
market("Miami", "Miami", "Florida", "USA", { name: "The Nickel", category: "bar", latitude: 25.7743, longitude: -80.1953, address: "1782 NW 2nd Ave, Miami, FL", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick" });
market("Miami", "Miami", "Florida", "USA", { name: "Basement Miami", category: "experience", latitude: 25.7784, longitude: -80.1333, address: "2901 Collins Ave, Miami Beach, FL", bestFor: ["Live Music", "Late-Night Food", "shuffleboard"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Basement+Miami+Beach" });

// Austin — more bars, speakeasies, game bars
market("Austin", "Austin", "Texas", "USA", { name: "The Hole in the Wall", category: "bar", latitude: 30.2853, longitude: -97.7421, address: "2538 Guadalupe St, Austin, TX", bestFor: ["Live Music", "Late-Night Food", "pool table"], sourceLabel: "Local favorite" });
market("Austin", "Austin", "Texas", "USA", { name: "Rainey Street Bar Crawl Hub", category: "bar", latitude: 30.2562, longitude: -97.7432, address: "95 Rainey St, Austin, TX", bestFor: ["Patio Energy", "Late-Night Food"], sourceLabel: "Local favorite" });
market("Austin", "Austin", "Texas", "USA", { name: "Nickel City", category: "bar", latitude: 30.2560, longitude: -97.7292, address: "1503 E 6th St, Austin, TX", bestFor: ["Date Night", "game bar", "shuffleboard"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Nickel+City+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Launderette", category: "restaurant", latitude: 30.2623, longitude: -97.7263, address: "2115 Holly St, Austin, TX", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Launderette+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Weather Up", category: "bar", latitude: 30.2710, longitude: -97.7534, address: "1006 Lamar Blvd, Austin, TX", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite" });

// Nashville — more bars, game bars, speakeasies
market("Nashville", "Nashville", "Tennessee", "USA", { name: "L.A. Jackson", category: "bar", latitude: 36.1538, longitude: -86.7825, address: "401 11th Ave S, Nashville, TN", bestFor: ["Patio Energy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=LA+Jackson+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Winners Bar & Grille", category: "bar", latitude: 36.1630, longitude: -86.7793, address: "422 Broadway, Nashville, TN", bestFor: ["Live Music", "Late-Night Food", "pool table"], sourceLabel: "Local favorite" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "No. 308", category: "bar", latitude: 36.1539, longitude: -86.7670, address: "407 Gallatin Ave, Nashville, TN", bestFor: ["Date Night", "Speakeasy"], sourceLabel: "Yelp pick" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "The Pharmacy Burger Parlor", category: "restaurant", latitude: 36.1789, longitude: -86.7421, address: "731 McFerrin Ave, Nashville, TN", bestFor: ["Late-Night Food", "No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Pharmacy+Burger+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Acme Feed & Seed", category: "bar", latitude: 36.1614, longitude: -86.7736, address: "101 Broadway, Nashville, TN", bestFor: ["Live Music", "Patio Energy", "game bar"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Acme+Feed+Seed+Nashville" });

// Seattle — more bars, speakeasies, game bars
market("Seattle", "Seattle", "Washington", "USA", { name: "Montana Bar", category: "bar", latitude: 47.5977, longitude: -122.3267, address: "1506 E Olive Way, Seattle, WA", bestFor: ["Date Night", "pool table"], sourceLabel: "Local favorite" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Needle & Thread", category: "bar", latitude: 47.6158, longitude: -122.3480, address: "2128 2nd Ave, Seattle, WA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Needle+and+Thread+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Optimism Brewing", category: "bar", latitude: 47.6120, longitude: -122.3193, address: "1158 Broadway, Seattle, WA", bestFor: ["Patio Energy", "No Wait", "shuffleboard"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Optimism+Brewing+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Radiator Whiskey", category: "bar", latitude: 47.6089, longitude: -122.3412, address: "94 Pike St, Seattle, WA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Yelp pick" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Manolin", category: "restaurant", latitude: 47.6590, longitude: -122.3773, address: "3621 Stone Way N, Seattle, WA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Manolin+Seattle" });

// San Francisco — more bars, speakeasies, game bars
market("San Francisco", "San Francisco", "California", "USA", { name: "The Interval at Long Now", category: "bar", latitude: 37.8068, longitude: -122.4178, address: "2 Marina Blvd, San Francisco, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Local favorite" });
market("San Francisco", "San Francisco", "California", "USA", { name: "15 Romolo", category: "bar", latitude: 37.7983, longitude: -122.4081, address: "15 Romolo Pl, San Francisco, CA", bestFor: ["Date Night", "Speakeasy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=15+Romolo+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "The Wicked Monk", category: "bar", latitude: 37.7278, longitude: -122.4732, address: "formerly Hayes Valley, San Francisco, CA", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Local favorite" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Maven", category: "bar", latitude: 37.7748, longitude: -122.4375, address: "598 Haight St, San Francisco, CA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Yelp pick" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Powerhouse", category: "bar", latitude: 37.7709, longitude: -122.4167, address: "1347 Folsom St, San Francisco, CA", bestFor: ["Live Music", "Late-Night Food", "pool table"], sourceLabel: "Local favorite" });

// Boston — more bars, speakeasies, game bars
market("Boston", "Boston", "Massachusetts", "USA", { name: "Hawthorne", category: "bar", latitude: 42.3468, longitude: -71.0817, address: "500A Commonwealth Ave, Boston, MA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Hawthorne+Bar+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "McGreevy's", category: "bar", latitude: 42.3483, longitude: -71.0842, address: "911 Boylston St, Boston, MA", bestFor: ["Live Music", "pool table", "Late-Night Food"], sourceLabel: "Yelp pick" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Scampo", category: "restaurant", latitude: 42.3614, longitude: -71.0651, address: "215 Charles St, Boston, MA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Scampo+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Yvonne's Side Door", category: "bar", latitude: 42.3557, longitude: -71.0607, address: "2 Winter Pl, Boston, MA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Local favorite" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Peterboro", category: "bar", latitude: 42.3498, longitude: -71.0845, address: "1052 Boylston St, Boston, MA", bestFor: ["Late-Night Food", "Date Night", "darts"], sourceLabel: "Yelp pick" });

// Washington DC — more bars, speakeasies, game bars
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "The Gibson", category: "bar", latitude: 38.9189, longitude: -77.0226, address: "2009 14th St NW, Washington, DC", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Gibson+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Wonderland Ballroom", category: "bar", latitude: 38.9316, longitude: -77.0268, address: "1101 Kenyon St NW, Washington, DC", bestFor: ["Live Music", "Late-Night Food", "pool table"], sourceLabel: "Local favorite" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Bluejacket Brewery", category: "bar", latitude: 38.8796, longitude: -77.0051, address: "300 Tingey St SE, Washington, DC", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bluejacket+Brewery+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Immigrant Food", category: "restaurant", latitude: 38.8985, longitude: -77.0332, address: "1701 Pennsylvania Ave NW, Washington, DC", bestFor: ["Date Night", "No Wait"], sourceLabel: "Yelp pick" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Punch Bowl Social DC", category: "experience", latitude: 38.9125, longitude: -77.0293, address: "1247 14th St NW, Washington, DC", bestFor: ["game bar", "shuffleboard", "bowling", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Punch+Bowl+Social+DC" });

// Vancouver — more bars, speakeasies, game bars
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Narrow Lounge", category: "bar", latitude: 49.2629, longitude: -123.0927, address: "1898 Main St, Vancouver, BC", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Narrow+Lounge+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Craft Beer Market", category: "bar", latitude: 49.2843, longitude: -123.1203, address: "85 W 1st Ave, Vancouver, BC", bestFor: ["No Wait", "Patio Energy", "shuffleboard"], sourceLabel: "Yelp pick" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Bao Bei Chinese Brasserie", category: "restaurant", latitude: 49.2800, longitude: -123.1020, address: "163 Keefer St, Vancouver, BC", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bao+Bei+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Alibi Room", category: "bar", latitude: 49.2838, longitude: -123.0996, address: "157 Alexander St, Vancouver, BC", bestFor: ["Date Night", "No Wait"], sourceLabel: "Local favorite" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Guilt & Co.", category: "experience", latitude: 49.2836, longitude: -123.1013, address: "1 Alexander St, Vancouver, BC", bestFor: ["Live Music", "Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Guilt+and+Co+Vancouver" });

// Mexico City — more bars, speakeasies, game bars
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Licorería Limantour", category: "bar", latitude: 19.4160, longitude: -99.1624, address: "Álvaro Obregón 106, Roma Norte, Mexico City", bestFor: ["Date Night", "Speakeasy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Licoreria+Limantour+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Jules Basement", category: "bar", latitude: 19.4215, longitude: -99.1748, address: "Anatole France 100, Polanco, Mexico City", bestFor: ["Speakeasy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Jules+Basement+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Hanky Panky", category: "bar", latitude: 19.4125, longitude: -99.1702, address: "Iztaccihuatl 34, Condesa, Mexico City", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Hanky+Panky+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Expendio de Maíz Sin Nombre", category: "restaurant", latitude: 19.4147, longitude: -99.1691, address: "Campeche 396, Condesa, Mexico City", bestFor: ["Date Night", "No Wait"], sourceLabel: "Local favorite" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Mercado Roma", category: "restaurant", latitude: 19.4169, longitude: -99.1668, address: "Querétaro 225, Roma Norte, Mexico City", bestFor: ["No Wait", "Late-Night Food"], sourceLabel: "Yelp pick" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Parker & Lenox", category: "bar", latitude: 19.4233, longitude: -99.1758, address: "Newton 88, Polanco, Mexico City", bestFor: ["Speakeasy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Parker+and+Lenox+CDMX" });

// ---------- ALL-MARKETS EXPANSION WAVE ----------

// New York City
market("New York", "New York City", "New York", "USA", { name: "Employees Only", category: "bar", latitude: 40.7331, longitude: -74.0065, address: "510 Hudson St, New York, NY", bestFor: ["Speakeasy", "Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Employees+Only+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Death & Co", category: "bar", latitude: 40.7259, longitude: -73.9846, address: "433 E 6th St, New York, NY", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Death+and+Co+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Minetta Tavern", category: "restaurant", latitude: 40.7302, longitude: -74.0006, address: "113 MacDougal St, New York, NY", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Minetta+Tavern+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Smalls Jazz Club", category: "experience", latitude: 40.7340, longitude: -74.0026, address: "183 W 10th St, New York, NY", bestFor: ["Live Music", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Smalls+Jazz+Club+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Levain Bakery", category: "cafe", latitude: 40.7796, longitude: -73.9805, address: "167 W 74th St, New York, NY", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Levain+Bakery+NYC" });

// Chicago
chicago({ name: "Lost Lake", category: "bar", latitude: 41.9320, longitude: -87.7051, address: "3154 W Diversey Ave, Chicago, IL", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Lost+Lake+Chicago" });
chicago({ name: "Monteverde", category: "restaurant", latitude: 41.8817, longitude: -87.6519, address: "1020 W Madison St, Chicago, IL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Monteverde+Chicago" });
chicago({ name: "Gilt Bar", category: "bar", latitude: 41.8892, longitude: -87.6345, address: "230 W Kinzie St, Chicago, IL", bestFor: ["Speakeasy", "Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Gilt+Bar+Chicago" });
chicago({ name: "Music Box Theatre", category: "experience", latitude: 41.9502, longitude: -87.6637, address: "3733 N Southport Ave, Chicago, IL", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Music+Box+Theatre+Chicago" });

// San Francisco
market("San Francisco", "San Francisco", "California", "USA", { name: "Tommy's Mexican Restaurant", category: "restaurant", latitude: 37.7803, longitude: -122.4838, address: "5929 Geary Blvd, San Francisco, CA", bestFor: ["No Wait", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Tommy's+Mexican+Restaurant+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "The Snug", category: "bar", latitude: 37.7906, longitude: -122.4343, address: "2301 Fillmore St, San Francisco, CA", bestFor: ["No Wait", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Snug+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Dalva", category: "bar", latitude: 37.7648, longitude: -122.4223, address: "3121 16th St, San Francisco, CA", bestFor: ["No Wait", "Late-Night Food"], sourceLabel: "Local favorite" });
market("San Francisco", "San Francisco", "California", "USA", { name: "b. patisserie", category: "cafe", latitude: 37.7879, longitude: -122.4408, address: "2821 California St, San Francisco, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=b+patisserie+SF" });

// Austin
market("Austin", "Austin", "Texas", "USA", { name: "Justine's Brasserie", category: "restaurant", latitude: 30.2531, longitude: -97.7076, address: "4710 E 5th St, Austin, TX", bestFor: ["Date Night", "Late-Night Food", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Justine's+Brasserie+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "The Roosevelt Room", category: "bar", latitude: 30.2672, longitude: -97.7457, address: "307 W 5th St, Austin, TX", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Roosevelt+Room+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Cosmic Coffee + Beer Garden", category: "cafe", latitude: 30.2225, longitude: -97.7594, address: "121 Pickle Rd, Austin, TX", bestFor: ["Patio Energy", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cosmic+Coffee+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Broken Spoke", category: "experience", latitude: 30.2288, longitude: -97.7810, address: "3201 S Lamar Blvd, Austin, TX", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Broken+Spoke+Austin" });

// Nashville
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Lockeland Table", category: "restaurant", latitude: 36.1781, longitude: -86.7375, address: "1520 Woodland St, Nashville, TN", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Lockeland+Table+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Bastion", category: "bar", latitude: 36.1445, longitude: -86.7726, address: "434 Houston St, Nashville, TN", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bastion+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Five Daughters Bakery", category: "cafe", latitude: 36.1213, longitude: -86.7893, address: "1110 Caruthers Ave, Nashville, TN", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Five+Daughters+Bakery+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Third Man Records", category: "retail", latitude: 36.1526, longitude: -86.7739, address: "623 7th Ave S, Nashville, TN", bestFor: ["Retail Drop", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Third+Man+Records+Nashville" });

// Seattle
market("Seattle", "Seattle", "Washington", "USA", { name: "The Pink Door", category: "restaurant", latitude: 47.6103, longitude: -122.3425, address: "1919 Post Alley, Seattle, WA", bestFor: ["Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Pink+Door+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Shorty's", category: "bar", latitude: 47.6136, longitude: -122.3467, address: "2222 2nd Ave, Seattle, WA", bestFor: ["No Wait", "Late-Night Food", "Bar Games"], sourceLabel: "Local favorite" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Unicorn", category: "bar", latitude: 47.6139, longitude: -122.3175, address: "1118 E Pike St, Seattle, WA", bestFor: ["Late-Night Food", "Bar Games"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Unicorn+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Ada's Technical Books & Cafe", category: "cafe", latitude: 47.6229, longitude: -122.3125, address: "425 15th Ave E, Seattle, WA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ada's+Technical+Books+Seattle" });

// Miami
market("Miami", "Miami", "Florida", "USA", { name: "Mac's Club Deuce", category: "bar", latitude: 25.7877, longitude: -80.1327, address: "222 14th St, Miami Beach, FL", bestFor: ["No Wait", "Late-Night Food", "pool table"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mac's+Club+Deuce+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Lung Yai Thai Tapas", category: "restaurant", latitude: 25.7657, longitude: -80.2238, address: "1731 SW 8th St, Miami, FL", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Lung+Yai+Thai+Tapas+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Books & Books Coral Gables", category: "retail", latitude: 25.7508, longitude: -80.2593, address: "265 Aragon Ave, Coral Gables, FL", bestFor: ["No Wait", "Retail Drop"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Books+and+Books+Coral+Gables" });
market("Miami", "Miami", "Florida", "USA", { name: "The Salty Donut", category: "cafe", latitude: 25.7988, longitude: -80.1996, address: "50 NW 23rd St, Miami, FL", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Salty+Donut+Wynwood" });

// Toronto
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Cold Tea", category: "bar", latitude: 43.6541, longitude: -79.4008, address: "60 Kensington Ave, Toronto, ON", bestFor: ["Speakeasy", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cold+Tea+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Terroni Queen West", category: "restaurant", latitude: 43.6461, longitude: -79.4069, address: "720 Queen St W, Toronto, ON", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Terroni+Queen+West+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Sonic Boom Records", category: "retail", latitude: 43.6497, longitude: -79.3973, address: "215 Spadina Ave, Toronto, ON", bestFor: ["Retail Drop", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sonic+Boom+Records+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Fahrenheit Coffee", category: "cafe", latitude: 43.6519, longitude: -79.3733, address: "120 Lombard St, Toronto, ON", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Fahrenheit+Coffee+Toronto" });

// Vancouver
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Ask for Luigi", category: "restaurant", latitude: 49.2846, longitude: -123.0980, address: "305 Alexander St, Vancouver, BC", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ask+for+Luigi+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Pourhouse", category: "bar", latitude: 49.2843, longitude: -123.1077, address: "162 Water St, Vancouver, BC", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Pourhouse+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Cascade Room", category: "bar", latitude: 49.2620, longitude: -123.1008, address: "2616 Main St, Vancouver, BC", bestFor: ["No Wait", "Date Night"], sourceLabel: "Local favorite" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "The Birds & The Beets", category: "cafe", latitude: 49.2833, longitude: -123.1043, address: "55 Powell St, Vancouver, BC", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Birds+and+the+Beets+Vancouver" });

// Boston
market("Boston", "Boston", "Massachusetts", "USA", { name: "Eastern Standard", category: "restaurant", latitude: 42.3489, longitude: -71.0950, address: "528 Commonwealth Ave, Boston, MA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Eastern+Standard+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Brick & Mortar", category: "bar", latitude: 42.3644, longitude: -71.1032, address: "567 Massachusetts Ave, Cambridge, MA", bestFor: ["Speakeasy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Brick+and+Mortar+Cambridge" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Lolita Cocina & Tequila Bar", category: "restaurant", latitude: 42.3506, longitude: -71.0779, address: "271 Dartmouth St, Boston, MA", bestFor: ["Date Night", "Late-Night Food"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Lolita+Cocina+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Tatte Bakery Beacon Hill", category: "cafe", latitude: 42.3582, longitude: -71.0707, address: "70 Charles St, Boston, MA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Tatte+Bakery+Beacon+Hill" });

// Washington DC
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "The Dabney", category: "restaurant", latitude: 38.9058, longitude: -77.0230, address: "122 Blagden Alley NW, Washington, DC", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Dabney+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Jack Rose Dining Saloon", category: "bar", latitude: 38.9174, longitude: -77.0417, address: "2007 18th St NW, Washington, DC", bestFor: ["Date Night", "Patio Energy", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Jack+Rose+Dining+Saloon+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Baked & Wired", category: "cafe", latitude: 38.9036, longitude: -77.0605, address: "1052 Thomas Jefferson St NW, Washington, DC", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Baked+and+Wired+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Solid State Books", category: "retail", latitude: 38.9002, longitude: -76.9980, address: "600 H St NE, Washington, DC", bestFor: ["No Wait", "Retail Drop"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Solid+State+Books+DC" });

// Mexico City
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Salón Ríos", category: "restaurant", latitude: 19.4283, longitude: -99.1741, address: "Río Lerma 218, Cuauhtémoc, Mexico City", bestFor: ["Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Salon+Rios+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "El Califa", category: "restaurant", latitude: 19.4064, longitude: -99.1782, address: "Altata 22, Condesa, Mexico City", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=El+Califa+Condesa" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Blend Station", category: "cafe", latitude: 19.4133, longitude: -99.1743, address: "Av. Tamaulipas 60, Condesa, Mexico City", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Blend+Station+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Departamento", category: "bar", latitude: 19.4179, longitude: -99.1633, address: "Álvaro Obregón 154, Roma Norte, Mexico City", bestFor: ["Live Music", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Departamento+CDMX" });

// ---------- NEWPORT BEACH DEEP EXPANSION ----------

// Mariners Mile / PCH West
market("Newport Beach", "Los Angeles", "California", "USA", { name: "The Rusty Pelican", category: "restaurant", latitude: 33.6142, longitude: -117.9389, address: "2735 W Coast Hwy, Newport Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Rusty+Pelican+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "A Restaurant", category: "restaurant", latitude: 33.6128, longitude: -117.9307, address: "3334 W Coast Hwy, Newport Beach, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=A+Restaurant+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Harborside Restaurant", category: "restaurant", latitude: 33.6151, longitude: -117.9258, address: "3001 W Coast Hwy, Newport Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Harborside+Restaurant+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Bluewater Grill Newport Harbor", category: "restaurant", latitude: 33.6044, longitude: -117.9258, address: "630 Lido Park Dr, Newport Beach, CA", bestFor: ["Date Night", "Patio Energy", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bluewater+Grill+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Don the Beachcomber", category: "bar", latitude: 33.6152, longitude: -117.9261, address: "3000 W Coast Hwy, Newport Beach, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Don+the+Beachcomber+Newport+Beach" });

// Lido Marina Village
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Lido Bottle Works", category: "bar", latitude: 33.6067, longitude: -117.9254, address: "3408 Via Oporto, Newport Beach, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Lido+Bottle+Works+Newport+Beach" });

// Balboa Peninsula & Newport Pier
market("Newport Beach", "Los Angeles", "California", "USA", { name: "21 Oceanfront", category: "restaurant", latitude: 33.6034, longitude: -117.9334, address: "2100 W Oceanfront, Newport Beach, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=21+Oceanfront+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Mutt Lynch's", category: "bar", latitude: 33.6027, longitude: -117.9341, address: "2300 W Oceanfront, Newport Beach, CA", bestFor: ["No Wait", "Patio Energy", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mutt+Lynch's+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Woody's Wharf", category: "bar", latitude: 33.6133, longitude: -117.9264, address: "2318 Newport Blvd, Newport Beach, CA", bestFor: ["Live Music", "Patio Energy", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Woody's+Wharf+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Mama D's Italian Kitchen", category: "restaurant", latitude: 33.6160, longitude: -117.9252, address: "3012 Newport Blvd, Newport Beach, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mama+D's+Italian+Kitchen+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "The Crab Cooker", category: "restaurant", latitude: 33.6123, longitude: -117.9243, address: "2200 Newport Blvd, Newport Beach, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Crab+Cooker+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Alta Coffee", category: "cafe", latitude: 33.6082, longitude: -117.9260, address: "506 31st St, Newport Beach, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alta+Coffee+Newport+Beach" });

// Balboa Island
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Basilic Restaurant", category: "restaurant", latitude: 33.6046, longitude: -117.8903, address: "217 Marine Ave, Balboa Island, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Basilic+Restaurant+Balboa+Island" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Dad's Donut & Bakery", category: "cafe", latitude: 33.6040, longitude: -117.8908, address: "309 Marine Ave, Balboa Island, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });

// Fashion Island
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Nobu Newport Beach", category: "restaurant", latitude: 33.6164, longitude: -117.8722, address: "143 Newport Center Dr, Newport Beach, CA", bestFor: ["Date Night", "Speakeasy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Nobu+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Mastro's Ocean Club", category: "restaurant", latitude: 33.6179, longitude: -117.8741, address: "1131 Newport Center Dr, Newport Beach, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mastro's+Ocean+Club+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "True Food Kitchen Newport", category: "restaurant", latitude: 33.6157, longitude: -117.8746, address: "451 Newport Center Dr, Newport Beach, CA", bestFor: ["No Wait", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=True+Food+Kitchen+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "R+D Kitchen Newport Beach", category: "restaurant", latitude: 33.6161, longitude: -117.8740, address: "101 Newport Center Dr, Newport Beach, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=R+D+Kitchen+Newport+Beach" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Stag Bar + Kitchen", category: "bar", latitude: 33.6160, longitude: -117.8754, address: "297 Newport Center Dr, Newport Beach, CA", bestFor: ["Late-Night Food", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Stag+Bar+Kitchen+Newport+Beach" });

// Corona del Mar
market("Newport Beach", "Los Angeles", "California", "USA", { name: "The Bungalow CDM", category: "bar", latitude: 33.5957, longitude: -117.8690, address: "2441 E Coast Hwy, Corona del Mar, CA", bestFor: ["Date Night", "No Wait", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Bungalow+Corona+del+Mar" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Bandera", category: "restaurant", latitude: 33.5946, longitude: -117.8699, address: "3201 E Coast Hwy, Corona del Mar, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bandera+Corona+del+Mar" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Helmsman Ale House", category: "bar", latitude: 33.5933, longitude: -117.8713, address: "2855 E Coast Hwy, Corona del Mar, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Helmsman+Ale+House+Corona+del+Mar" });
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Five Crowns CDM", category: "restaurant", latitude: 33.5939, longitude: -117.8705, address: "3801 E Coast Hwy, Corona del Mar, CA", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Five+Crowns+Corona+del+Mar" });

// Crystal Cove
market("Newport Beach", "Los Angeles", "California", "USA", { name: "The Beachcomber at Crystal Cove", category: "restaurant", latitude: 33.5782, longitude: -117.8375, address: "15 Crystal Cove, Newport Coast, CA", bestFor: ["Date Night", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Beachcomber+Crystal+Cove" });

// ---------- OC MARKET EXPANSION ----------

// Costa Mesa
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "Taco Maria", category: "restaurant", latitude: 33.6857, longitude: -117.8860, address: "3313 Hyland Ave, Costa Mesa, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Taco+Maria+Costa+Mesa" });
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "Mesa Restaurant", category: "bar", latitude: 33.6626, longitude: -117.9158, address: "1640 Pomona Ave, Costa Mesa, CA", bestFor: ["Date Night", "Late-Night Food", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mesa+Restaurant+Costa+Mesa" });
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "Mother's Market & Kitchen", category: "cafe", latitude: 33.6651, longitude: -117.9019, address: "225 E 17th St, Costa Mesa, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Mother's+Market+Kitchen+Costa+Mesa" });
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "The Waffle", category: "cafe", latitude: 33.6716, longitude: -117.9009, address: "1030 Baker St, Costa Mesa, CA", bestFor: ["No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=The+Waffle+Costa+Mesa" });
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "The Lot at SOCO", category: "experience", latitude: 33.6860, longitude: -117.8851, address: "3321 Hyland Ave, Costa Mesa, CA", bestFor: ["No Wait", "Patio Energy", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Lot+SOCO+Costa+Mesa" });

// Huntington Beach
market("Huntington Beach", "Los Angeles", "California", "USA", { name: "Shorebreak Kitchen & Bar", category: "restaurant", latitude: 33.6582, longitude: -118.0008, address: "500 Pacific Coast Hwy, Huntington Beach, CA", bestFor: ["Patio Energy", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Shorebreak+Kitchen+Huntington+Beach" });
market("Huntington Beach", "Los Angeles", "California", "USA", { name: "Sugar Shack Café", category: "cafe", latitude: 33.6593, longitude: -118.0001, address: "213½ Main St, Huntington Beach, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sugar+Shack+Cafe+Huntington+Beach" });
market("Huntington Beach", "Los Angeles", "California", "USA", { name: "Perqs Bar", category: "bar", latitude: 33.6596, longitude: -117.9997, address: "330 Main St, Huntington Beach, CA", bestFor: ["No Wait", "Late-Night Food", "darts"], sourceLabel: "Local favorite" });
market("Huntington Beach", "Los Angeles", "California", "USA", { name: "Baja Sharkeez HB", category: "bar", latitude: 33.6590, longitude: -118.0003, address: "211 Main St, Huntington Beach, CA", bestFor: ["Late-Night Food", "No Wait", "Patio Energy"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Baja+Sharkeez+Huntington+Beach" });

// Irvine
market("Irvine", "Los Angeles", "California", "USA", { name: "Bosscat Kitchen & Libations", category: "bar", latitude: 33.6692, longitude: -117.8505, address: "4397 Campus Dr, Newport Beach, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bosscat+Kitchen+Newport+Beach" });
market("Irvine", "Los Angeles", "California", "USA", { name: "Zov's Bistro & Bar", category: "restaurant", latitude: 33.7297, longitude: -117.8244, address: "17440 E 17th St, Tustin, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Zov's+Bistro+Tustin" });
market("Irvine", "Los Angeles", "California", "USA", { name: "The Ranch Restaurant", category: "restaurant", latitude: 33.8183, longitude: -117.8434, address: "1025 E Foothill Blvd, Anaheim, CA", bestFor: ["Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Ranch+Restaurant+Anaheim" });

// Seal Beach
market("Seal Beach", "Los Angeles", "California", "USA", { name: "Simmzy's Seal Beach", category: "restaurant", latitude: 33.7411, longitude: -118.1044, address: "340 Main St, Seal Beach, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Simmzy's+Seal+Beach" });
market("Seal Beach", "Los Angeles", "California", "USA", { name: "O'Malley's on Main", category: "bar", latitude: 33.7409, longitude: -118.1041, address: "324 Main St, Seal Beach, CA", bestFor: ["No Wait", "Late-Night Food", "pool table"], sourceLabel: "Local favorite" });

// Fullerton
market("Fullerton", "Los Angeles", "California", "USA", { name: "Heroes Restaurant & Brewery", category: "bar", latitude: 33.8701, longitude: -117.9268, address: "125 W Commonwealth Ave, Fullerton, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Heroes+Restaurant+Brewery+Fullerton" });
market("Fullerton", "Los Angeles", "California", "USA", { name: "The Continental Room", category: "bar", latitude: 33.8709, longitude: -117.9260, address: "115 E Commonwealth Ave, Fullerton, CA", bestFor: ["Speakeasy", "Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Continental+Room+Fullerton" });

// Santa Ana
market("Santa Ana", "Los Angeles", "California", "USA", { name: "Lola Gaspar", category: "bar", latitude: 33.7455, longitude: -117.8674, address: "211 W 2nd St, Santa Ana, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Lola+Gaspar+Santa+Ana" });
market("Santa Ana", "Los Angeles", "California", "USA", { name: "Alta Baja Market", category: "cafe", latitude: 33.7454, longitude: -117.8681, address: "201 N Broadway, Santa Ana, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alta+Baja+Market+Santa+Ana" });

// Anaheim
market("Anaheim", "Los Angeles", "California", "USA", { name: "Anaheim Packing House", category: "experience", latitude: 33.8350, longitude: -117.9180, address: "440 S Anaheim Blvd, Anaheim, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Anaheim+Packing+House" });
market("Anaheim", "Los Angeles", "California", "USA", { name: "The Catch Restaurant", category: "restaurant", latitude: 33.8072, longitude: -117.9135, address: "1929 S State College Blvd, Anaheim, CA", bestFor: ["Date Night", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Catch+Restaurant+Anaheim" });

// Laguna Beach
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Cedar Creek Inn", category: "restaurant", latitude: 33.5430, longitude: -117.7843, address: "384 Forest Ave, Laguna Beach, CA", bestFor: ["Date Night", "Patio Energy", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cedar+Creek+Inn+Laguna+Beach" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "The Loft at Montage Laguna Beach", category: "experience", latitude: 33.5215, longitude: -117.7621, address: "30801 S Coast Hwy, Laguna Beach, CA", bestFor: ["Date Night", "Live Music"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=The+Loft+Montage+Laguna+Beach" });

// Dana Point
market("Dana Point", "Los Angeles", "California", "USA", { name: "La Sirena Grill Dana Point", category: "restaurant", latitude: 33.4668, longitude: -117.6983, address: "24562 Del Prado, Dana Point, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });
market("Dana Point", "Los Angeles", "California", "USA", { name: "Waterbar Dana Point", category: "bar", latitude: 33.4714, longitude: -117.7032, address: "34671 Golden Lantern St, Dana Point, CA", bestFor: ["Patio Energy", "Date Night", "No Wait"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Waterbar+Dana+Point" });

// San Juan Capistrano
market("San Juan Capistrano", "Los Angeles", "California", "USA", { name: "Sundried Tomato Café", category: "cafe", latitude: 33.5016, longitude: -117.6621, address: "31781 Camino Capistrano, San Juan Capistrano, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Sundried+Tomato+Cafe+San+Juan+Capistrano" });
market("San Juan Capistrano", "Los Angeles", "California", "USA", { name: "Swallow's Inn", category: "bar", latitude: 33.4972, longitude: -117.6598, address: "31786 Camino Capistrano, San Juan Capistrano, CA", bestFor: ["Live Music", "Late-Night Food", "No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Swallows+Inn+San+Juan+Capistrano" });

// Brea
market("Brea", "Los Angeles", "California", "USA", { name: "Eureka! Brea", category: "restaurant", latitude: 33.9176, longitude: -117.9008, address: "444 Brea Mall, Brea, CA", bestFor: ["No Wait", "Date Night"], sourceLabel: "Yelp pick", sourceUrl: "https://www.yelp.com/search?find_desc=Eureka+Brea" });
market("Brea", "Los Angeles", "California", "USA", { name: "The Packing House Brea", category: "experience", latitude: 33.9172, longitude: -117.9011, address: "125 S Brea Blvd, Brea, CA", bestFor: ["No Wait", "Live Music"], sourceLabel: "Local favorite" });

// ---------- ALFRED COFFEE — ALL LA LOCATIONS ----------
market("West Hollywood", "Los Angeles", "California", "USA", { name: "Alfred Coffee Melrose Place", category: "cafe", latitude: 34.0834, longitude: -118.3694, address: "8428 Melrose Pl, West Hollywood, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alfred+Coffee+Melrose+Place" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Alfred Coffee Silver Lake", category: "cafe", latitude: 34.0878, longitude: -118.2769, address: "3817 W Sunset Blvd, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alfred+Coffee+Silver+Lake" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Alfred Coffee Brentwood", category: "cafe", latitude: 34.0498, longitude: -118.4757, address: "11901 Santa Monica Blvd, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alfred+Coffee+Brentwood" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Alfred Coffee The Row DTLA", category: "cafe", latitude: 34.0365, longitude: -118.2339, address: "777 S Alameda St, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alfred+Coffee+The+Row+DTLA" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Alfred Coffee Beverly Hills", category: "cafe", latitude: 34.0673, longitude: -118.4001, address: "276 N Beverly Dr, Beverly Hills, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alfred+Coffee+Beverly+Hills" });
market("Studio City", "Los Angeles", "California", "USA", { name: "Alfred Coffee Studio City", category: "cafe", latitude: 34.1416, longitude: -118.3967, address: "12010 Ventura Blvd, Studio City, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alfred+Coffee+Studio+City" });
market("Venice", "Los Angeles", "California", "USA", { name: "Alfred Coffee Venice", category: "cafe", latitude: 33.9963, longitude: -118.4740, address: "1220 Rose Ave, Venice, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Alfred+Coffee+Venice" });

// ---------- MORE LA COFFEE ----------
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Go Get Em Tiger Larchmont", category: "cafe", latitude: 34.0797, longitude: -118.3237, address: "230 N Larchmont Blvd, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Go+Get+Em+Tiger+Larchmont" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "Intelligentsia Coffee Silver Lake", category: "cafe", latitude: 34.0895, longitude: -118.2781, address: "3922 Sunset Blvd, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Intelligentsia+Coffee+Silver+Lake" });
market("Los Angeles", "Los Angeles", "California", "USA", { name: "G&B Coffee Grand Central Market", category: "cafe", latitude: 34.0509, longitude: -118.2493, address: "317 S Broadway, Los Angeles, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=G+and+B+Coffee+Grand+Central+Market" });
market("Santa Monica", "Los Angeles", "California", "USA", { name: "Caffe Luxxe Montana", category: "cafe", latitude: 34.0337, longitude: -118.4985, address: "925 Montana Ave, Santa Monica, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Caffe+Luxxe+Santa+Monica" });
market("Santa Monica", "Los Angeles", "California", "USA", { name: "Dogtown Coffee", category: "cafe", latitude: 34.0017, longitude: -118.4804, address: "2003 Main St, Santa Monica, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Dogtown+Coffee+Santa+Monica" });
market("Pasadena", "Los Angeles", "California", "USA", { name: "Jones Coffee Roasters", category: "cafe", latitude: 34.1401, longitude: -118.1449, address: "537 S Raymond Ave, Pasadena, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Jones+Coffee+Roasters+Pasadena" });
market("Pasadena", "Los Angeles", "California", "USA", { name: "Intelligentsia Coffee Pasadena", category: "cafe", latitude: 34.1478, longitude: -118.1527, address: "55 E Colorado Blvd, Pasadena, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Intelligentsia+Coffee+Pasadena" });
market("Culver City", "Los Angeles", "California", "USA", { name: "Go Get Em Tiger Culver City", category: "cafe", latitude: 34.0108, longitude: -118.4019, address: "8954 Lindblade St, Culver City, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Go+Get+Em+Tiger+Culver+City" });
market("Burbank", "Los Angeles", "California", "USA", { name: "Romancing the Bean", category: "cafe", latitude: 34.1719, longitude: -118.3294, address: "3413 W Olive Ave, Burbank, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Romancing+the+Bean+Burbank" });
market("Sherman Oaks", "Los Angeles", "California", "USA", { name: "Tierra Mia Coffee Sherman Oaks", category: "cafe", latitude: 34.1516, longitude: -118.4474, address: "14656 Ventura Blvd, Sherman Oaks, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Tierra+Mia+Coffee+Sherman+Oaks" });
market("North Hollywood", "Los Angeles", "California", "USA", { name: "Groundwork Coffee NoHo", category: "cafe", latitude: 34.1688, longitude: -118.3822, address: "5124 Lankershim Blvd, North Hollywood, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Groundwork+Coffee+North+Hollywood" });
market("Glendale", "Los Angeles", "California", "USA", { name: "Lavender & Honey Espresso Bar", category: "cafe", latitude: 34.1452, longitude: -118.2554, address: "122 N Brand Blvd, Glendale, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Lavender+and+Honey+Espresso+Glendale" });

// ---------- OC MARKET COFFEE ----------
market("Newport Beach", "Los Angeles", "California", "USA", { name: "Kean Coffee Newport", category: "cafe", latitude: 33.6188, longitude: -117.9031, address: "2043 Westcliff Dr, Newport Beach, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Kean+Coffee+Newport+Beach" });
market("Costa Mesa", "Los Angeles", "California", "USA", { name: "Portola Coffee Lab", category: "cafe", latitude: 33.6857, longitude: -117.8850, address: "3313 Hyland Ave, Costa Mesa, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Portola+Coffee+Lab+Costa+Mesa" });
market("Laguna Beach", "Los Angeles", "California", "USA", { name: "Zinc Café & Market Laguna", category: "cafe", latitude: 33.5427, longitude: -117.7831, address: "350 Ocean Ave, Laguna Beach, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Zinc+Cafe+Laguna+Beach" });
market("Huntington Beach", "Los Angeles", "California", "USA", { name: "Coffee Dose Huntington Beach", category: "cafe", latitude: 33.6579, longitude: -118.0011, address: "211 Main St, Huntington Beach, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Coffee+Dose+Huntington+Beach" });
market("Irvine", "Los Angeles", "California", "USA", { name: "Kean Coffee Irvine", category: "cafe", latitude: 33.6839, longitude: -117.8267, address: "4261 Campus Dr, Irvine, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Kean+Coffee+Irvine" });
market("Fullerton", "Los Angeles", "California", "USA", { name: "Hallowed Grounds Coffee", category: "cafe", latitude: 33.8704, longitude: -117.9244, address: "300 E Chapman Ave, Fullerton, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Hallowed+Grounds+Coffee+Fullerton" });
market("Anaheim", "Los Angeles", "California", "USA", { name: "The Camp Snoopy Coffee Roasters", category: "cafe", latitude: 33.8353, longitude: -117.9145, address: "300 S Harbor Blvd, Anaheim, CA", bestFor: ["No Wait"], sourceLabel: "Local favorite" });

// ---------- NEW YORK COFFEE ----------
market("New York", "New York City", "New York", "USA", { name: "Gregory's Coffee Park Ave", category: "cafe", latitude: 40.7490, longitude: -73.9918, address: "874 6th Ave, New York, NY", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Gregory's+Coffee+New+York" });
market("New York", "New York City", "New York", "USA", { name: "Bluestone Lane West Village", category: "cafe", latitude: 40.7339, longitude: -74.0022, address: "55 Greenwich Ave, New York, NY", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bluestone+Lane+West+Village" });
market("New York", "New York City", "New York", "USA", { name: "Joe Coffee Waverly", category: "cafe", latitude: 40.7304, longitude: -74.0003, address: "141 Waverly Pl, New York, NY", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Joe+Coffee+Waverly+NYC" });
market("New York", "New York City", "New York", "USA", { name: "Partners Coffee Williamsburg", category: "cafe", latitude: 40.7183, longitude: -73.9584, address: "125 N 6th St, Brooklyn, NY", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Partners+Coffee+Williamsburg" });

// ---------- SAN FRANCISCO COFFEE ----------
market("San Francisco", "San Francisco", "California", "USA", { name: "Philz Coffee Mission", category: "cafe", latitude: 37.7525, longitude: -122.4175, address: "3101 24th St, San Francisco, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Philz+Coffee+Mission+SF" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Equator Coffees Ferry Building", category: "cafe", latitude: 37.7956, longitude: -122.3936, address: "One Ferry Building #7B, San Francisco, CA", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Equator+Coffees+Ferry+Building" });
market("San Francisco", "San Francisco", "California", "USA", { name: "Verve Coffee Roasters SF", category: "cafe", latitude: 37.7685, longitude: -122.4324, address: "2101 Market St, San Francisco, CA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Verve+Coffee+Roasters+San+Francisco" });

// ---------- AUSTIN COFFEE ----------
market("Austin", "Austin", "Texas", "USA", { name: "Greater Goods Coffee", category: "cafe", latitude: 30.2629, longitude: -97.7277, address: "2501 E 6th St, Austin, TX", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Greater+Goods+Coffee+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Epoch Coffee", category: "cafe", latitude: 30.3113, longitude: -97.7338, address: "221 W North Loop Blvd, Austin, TX", bestFor: ["No Wait", "Late-Night Food"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Epoch+Coffee+Austin" });
market("Austin", "Austin", "Texas", "USA", { name: "Flat Track Coffee", category: "cafe", latitude: 30.2600, longitude: -97.7244, address: "1619 E Cesar Chavez St, Austin, TX", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Flat+Track+Coffee+Austin" });

// ---------- NASHVILLE COFFEE ----------
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Ugly Mugs Coffee", category: "cafe", latitude: 36.1611, longitude: -86.7476, address: "1886 Eastland Ave, Nashville, TN", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ugly+Mugs+Coffee+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Bongo Java Belmont", category: "cafe", latitude: 36.1345, longitude: -86.8021, address: "2007 Belmont Blvd, Nashville, TN", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Bongo+Java+Nashville" });
market("Nashville", "Nashville", "Tennessee", "USA", { name: "Dose Coffee & Tea", category: "cafe", latitude: 36.1558, longitude: -86.8387, address: "3706 Charlotte Ave, Nashville, TN", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Dose+Coffee+Nashville" });

// ---------- SEATTLE COFFEE ----------
market("Seattle", "Seattle", "Washington", "USA", { name: "Victrola Coffee Roasters", category: "cafe", latitude: 47.6143, longitude: -122.3254, address: "310 E Pike St, Seattle, WA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Victrola+Coffee+Roasters+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Caffe Vita Capitol Hill", category: "cafe", latitude: 47.6139, longitude: -122.3175, address: "1005 E Pike St, Seattle, WA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Caffe+Vita+Capitol+Hill+Seattle" });
market("Seattle", "Seattle", "Washington", "USA", { name: "Lighthouse Roasters", category: "cafe", latitude: 47.6614, longitude: -122.3427, address: "400 N 43rd St, Seattle, WA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Lighthouse+Roasters+Seattle" });

// ---------- MIAMI COFFEE ----------
market("Miami", "Miami", "Florida", "USA", { name: "Café Versailles", category: "cafe", latitude: 25.7639, longitude: -80.2293, address: "3555 SW 8th St, Miami, FL", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cafe+Versailles+Miami" });
market("Miami", "Miami", "Florida", "USA", { name: "Panther Coffee Coconut Grove", category: "cafe", latitude: 25.7303, longitude: -80.2384, address: "3407 Main Hwy, Coconut Grove, FL", bestFor: ["No Wait", "Patio Energy"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Panther+Coffee+Coconut+Grove" });
market("Miami", "Miami", "Florida", "USA", { name: "Per'La Specialty Roasters", category: "cafe", latitude: 25.7938, longitude: -80.1910, address: "190 NE 46th St, Miami, FL", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=PerLa+Specialty+Roasters+Miami" });

// ---------- TORONTO COFFEE ----------
market("Toronto", "Toronto", "Ontario", "Canada", { name: "Detour Coffee", category: "cafe", latitude: 43.6618, longitude: -79.4298, address: "845 Bloor St W, Toronto, ON", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Detour+Coffee+Toronto" });
market("Toronto", "Toronto", "Ontario", "Canada", { name: "De Mello Palheta", category: "cafe", latitude: 43.6484, longitude: -79.3789, address: "53 Colborne St, Toronto, ON", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=De+Mello+Palheta+Toronto" });

// ---------- VANCOUVER COFFEE ----------
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Matchstick Coffee Roasters", category: "cafe", latitude: 49.2518, longitude: -123.0945, address: "639 E 15th Ave, Vancouver, BC", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Matchstick+Coffee+Vancouver" });
market("Vancouver", "Vancouver", "British Columbia", "Canada", { name: "Nemesis Coffee Gastown", category: "cafe", latitude: 49.2830, longitude: -123.1139, address: "302 W Hastings St, Vancouver, BC", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Nemesis+Coffee+Gastown+Vancouver" });

// ---------- BOSTON COFFEE ----------
market("Boston", "Boston", "Massachusetts", "USA", { name: "Gracenote Coffee", category: "cafe", latitude: 42.3641, longitude: -71.0559, address: "60 Canal St, Boston, MA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Gracenote+Coffee+Boston" });
market("Boston", "Boston", "Massachusetts", "USA", { name: "Ogawa Coffee Boston", category: "cafe", latitude: 42.3567, longitude: -71.0573, address: "10 Milk St, Boston, MA", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Ogawa+Coffee+Boston" });

// ---------- WASHINGTON DC COFFEE ----------
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Slipstream", category: "cafe", latitude: 38.9108, longitude: -77.0322, address: "1333 14th St NW, Washington, DC", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Slipstream+DC" });
market("Washington", "Washington DC", "District of Columbia", "USA", { name: "Qualia Coffee", category: "cafe", latitude: 38.9514, longitude: -77.0252, address: "3917 Georgia Ave NW, Washington, DC", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Qualia+Coffee+DC" });

// ---------- MEXICO CITY COFFEE ----------
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Cardinal Café", category: "cafe", latitude: 19.4343, longitude: -99.1447, address: "Dr. Mora 9, Centro Histórico, Mexico City", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cardinal+Cafe+CDMX" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "BUNA Coffee", category: "cafe", latitude: 19.4308, longitude: -99.1594, address: "Varsovia 7, Juárez, Mexico City", bestFor: ["No Wait"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=BUNA+Coffee+Mexico+City" });
market("Mexico City", "Mexico City", "CDMX", "Mexico", { name: "Café Nin", category: "cafe", latitude: 19.4188, longitude: -99.1627, address: "Puebla 238, Roma Norte, Mexico City", bestFor: ["No Wait", "Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Cafe+Nin+Roma+Norte" });

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

const BAR_GAMES_COMMENTS = [
  "Called a table 20 minutes out and it was ready right when we walked in. System works.",
  "Pool tables were all taken when we arrived but only waited one game. Turnover is quick.",
  "Shuffleboard lane opened up right as we finished our first round. Timing was perfect.",
  "Three pool tables, two taken. Grabbed the third, played for two hours no pressure.",
  "Darts board in the back is free basically all night on weekdays. No wait ever.",
  "Foosball tables are in rough shape but it adds to the charm honestly.",
  "Ping pong table gets packed after 10. Show up before 9 if you actually want a game.",
  "They have a wait list app for tables — put your name in at the bar, they text you.",
  "Mix of serious players and casual groups tonight. Good energy all around.",
  "Highly recommend the back room for shuffleboard — quieter and easier to hear each other.",
  "Bocce courts are outside and free to use. Best combo with the patio beers.",
  "Game tokens included with the cover. Actually a solid deal for what you get inside.",
  "Staff reset the pool table mid-game when a ball rolled under the bar. Solid service.",
  "Walked in on a Tuesday — had the whole game floor to ourselves basically.",
];

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
    const isBarGame = (v.bestFor ?? []).some((t) =>
      ["Pool Tables", "Shuffleboard", "Bar Games", "Darts", "Foosball", "Ping Pong", "Bocce"].includes(t)
    );
    const pool = isSpeakeasy
      ? SPEAKEASY_COMMENTS
      : isBarGame
        ? BAR_GAMES_COMMENTS
        : (COMMENTS_BY_CATEGORY[v.category] ?? COMMENTS_BY_CATEGORY.bar);
    const count = 6 + ((i * 7) % 5); // 6-10 comments per venue
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
