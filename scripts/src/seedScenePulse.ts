import { db, venuesTable } from "@workspace/db";
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
chicago({ name: "The Violet Hour", category: "bar", latitude: 41.9088, longitude: -87.6774, address: "1520 N Damen Ave, Chicago, IL", bestFor: ["Date Night", "Late-Night Food"] });
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

market("New York", "New York City", "New York", "USA", { name: "Please Don't Tell", category: "bar", latitude: 40.7272, longitude: -73.9840, address: "113 St Marks Pl, New York, NY", bestFor: ["Date Night"], sourceLabel: "Google Maps listing", sourceUrl: "https://maps.google.com/?q=Please+Don't+Tell+NYC" });
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

async function seed() {
  console.log(`Seeding ${venues.length} venues...`);
  await db.delete(venuesTable);
  await db.insert(venuesTable).values(venues.map((v) => ({ ...v, isWatchlisted: false })));
  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
