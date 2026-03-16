/**
 * EnergyMap Service Worker
 * Intercepts /api/* and port/5000/api/* calls, serves embedded data.
 * All external live APIs (NOAA, Open-Meteo, WAQI) pass through uncached.
 */

const VERSION = 'energymap-v1';

// ─── Embedded project dataset ─────────────────────────────────────────────────
const PROJECTS = [
  // ── Solar ──
  {id:"p001",name:"Bhadla Solar Park",country:"India",lat:27.54,lng:71.91,fuelType:"solar",status:"operating",capacityMw:2245,owner:"Rajasthan Renewable Energy Corp",commissionYear:2019,source:"Global Energy Monitor",risks:JSON.stringify(["water_stress","land_use"])},
  {id:"p002",name:"Al Dhafra Solar PV",country:"UAE",lat:23.67,lng:53.83,fuelType:"solar",status:"operating",capacityMw:1500,owner:"Masdar / EDF",commissionYear:2023,source:"GEM",risks:JSON.stringify(["heat_stress"])},
  {id:"p003",name:"Noor Abu Dhabi Solar",country:"UAE",lat:23.63,lng:53.78,fuelType:"solar",status:"operating",capacityMw:1177,owner:"ENEC / Marubeni",commissionYear:2019,source:"GEM",risks:JSON.stringify(["heat_stress"])},
  {id:"p004",name:"Tengger Desert Solar Park",country:"China",lat:37.5,lng:105.0,fuelType:"solar",status:"operating",capacityMw:1547,owner:"China National Solar",commissionYear:2016,source:"GEM",risks:JSON.stringify(["grid_curtailment"])},
  {id:"p005",name:"Pavagada Solar Park",country:"India",lat:14.1,lng:77.22,fuelType:"solar",status:"operating",capacityMw:2050,owner:"Karnataka Solar Power Dev Corp",commissionYear:2019,source:"GEM",risks:JSON.stringify(["water_stress"])},
  {id:"p006",name:"Sweihan Solar (Noor Abu Dhabi 2)",country:"UAE",lat:24.3,lng:55.5,fuelType:"solar",status:"construction",capacityMw:1500,owner:"Masdar",commissionYear:2025,source:"GEM",risks:JSON.stringify(["permitting"])},
  {id:"p007",name:"Topaz Solar Farm",country:"USA",lat:35.37,lng:-119.9,fuelType:"solar",status:"operating",capacityMw:550,owner:"Berkshire Hathaway",commissionYear:2014,source:"EIA",risks:JSON.stringify([])},
  {id:"p008",name:"Desert Sunlight Solar Farm",country:"USA",lat:33.83,lng:-115.43,fuelType:"solar",status:"operating",capacityMw:550,owner:"NextEra Energy",commissionYear:2015,source:"EIA",risks:JSON.stringify([])},
  {id:"p009",name:"Solar Star",country:"USA",lat:35.06,lng:-118.56,fuelType:"solar",status:"operating",capacityMw:579,owner:"Berkshire Hathaway",commissionYear:2015,source:"EIA",risks:JSON.stringify([])},
  {id:"p010",name:"Neoen Hornsdale Solar",country:"Australia",lat:-33.07,lng:138.39,fuelType:"solar",status:"operating",capacityMw:315,owner:"Neoen",commissionYear:2021,source:"AEMO",risks:JSON.stringify([])},
  {id:"p011",name:"Noor I CSP",country:"Morocco",lat:31.0,lng:-2.83,fuelType:"solar",status:"operating",capacityMw:160,owner:"MASEN",commissionYear:2016,source:"GEM",risks:JSON.stringify(["water_stress"])},
  {id:"p012",name:"Ivanpah Solar Electric Generating System",country:"USA",lat:35.56,lng:-115.47,fuelType:"solar",status:"operating",capacityMw:377,owner:"NRG Energy / Google",commissionYear:2014,source:"EIA",risks:JSON.stringify(["water_use"])},
  {id:"p013",name:"Gemasolar CSP",country:"Spain",lat:37.56,lng:-5.33,fuelType:"solar",status:"operating",capacityMw:20,owner:"Torresol Energy",commissionYear:2011,source:"GEM",risks:JSON.stringify([])},
  {id:"p014",name:"Rewa Ultra Mega Solar",country:"India",lat:24.53,lng:81.3,fuelType:"solar",status:"operating",capacityMw:750,owner:"Rewa Ultra Mega Solar Ltd",commissionYear:2018,source:"GEM",risks:JSON.stringify([])},
  {id:"p015",name:"Mohammed bin Rashid Al Maktoum Solar Park",country:"UAE",lat:24.86,lng:55.36,fuelType:"solar",status:"construction",capacityMw:5000,owner:"DEWA",commissionYear:2030,source:"GEM",risks:JSON.stringify(["financing"])},

  // ── Wind Onshore ──
  {id:"p020",name:"Gansu Wind Farm (Jiuquan)",country:"China",lat:40.0,lng:96.0,fuelType:"wind",status:"operating",capacityMw:7965,owner:"China Datang",commissionYear:2012,source:"GEM",risks:JSON.stringify(["grid_curtailment"])},
  {id:"p021",name:"Alta Wind Energy Center",country:"USA",lat:34.95,lng:-118.56,fuelType:"wind",status:"operating",capacityMw:1548,owner:"Terra-Gen",commissionYear:2013,source:"EIA",risks:JSON.stringify([])},
  {id:"p022",name:"Fowler Ridge Wind Farm",country:"USA",lat:40.52,lng:-87.37,fuelType:"wind",status:"operating",capacityMw:750,owner:"BP Wind Energy",commissionYear:2010,source:"EIA",risks:JSON.stringify([])},
  {id:"p023",name:"Roscoe Wind Farm",country:"USA",lat:32.45,lng:-100.53,fuelType:"wind",status:"operating",capacityMw:782,owner:"E.ON Climate & Renewables",commissionYear:2009,source:"EIA",risks:JSON.stringify([])},
  {id:"p024",name:"Fosen Vind",country:"Norway",lat:63.6,lng:9.7,fuelType:"wind",status:"operating",capacityMw:1057,owner:"Statkraft",commissionYear:2020,source:"NVE",risks:JSON.stringify(["legal"])},
  {id:"p025",name:"Wheatridge Wind & Solar",country:"USA",lat:45.7,lng:-119.6,fuelType:"wind",status:"operating",capacityMw:500,owner:"NextEra Energy",commissionYear:2020,source:"EIA",risks:JSON.stringify([])},
  {id:"p026",name:"Meerwind Onshore",country:"Germany",lat:53.9,lng:7.7,fuelType:"wind",status:"operating",capacityMw:288,owner:"WindMW",commissionYear:2015,source:"BNetzA",risks:JSON.stringify([])},
  {id:"p027",name:"Buffalo Gap Wind Farm",country:"USA",lat:31.8,lng:-100.0,fuelType:"wind",status:"operating",capacityMw:523,owner:"AES Wind Generation",commissionYear:2007,source:"EIA",risks:JSON.stringify([])},
  {id:"p028",name:"Dabancheng Wind Farm",country:"China",lat:43.37,lng:88.3,fuelType:"wind",status:"operating",capacityMw:500,owner:"Guohua Energy",commissionYear:2008,source:"GEM",risks:JSON.stringify([])},
  {id:"p029",name:"Jaisalmer Wind Park",country:"India",lat:27.3,lng:70.9,fuelType:"wind",status:"operating",capacityMw:1064,owner:"Suzlon Energy",commissionYear:2013,source:"GEM",risks:JSON.stringify([])},
  {id:"p030",name:"Macarthur Wind Farm",country:"Australia",lat:-38.15,lng:142.1,fuelType:"wind",status:"operating",capacityMw:420,owner:"Origin Energy / AGL",commissionYear:2013,source:"AEMO",risks:JSON.stringify([])},

  // ── Offshore Wind ──
  {id:"p040",name:"Hornsea One",country:"UK",lat:53.82,lng:1.87,fuelType:"wind_offshore",status:"operating",capacityMw:1218,owner:"Ørsted",commissionYear:2020,source:"BEIS",risks:JSON.stringify([])},
  {id:"p041",name:"Hornsea Two",country:"UK",lat:53.91,lng:1.73,fuelType:"wind_offshore",status:"operating",capacityMw:1386,owner:"Ørsted",commissionYear:2022,source:"BEIS",risks:JSON.stringify([])},
  {id:"p042",name:"Hornsea Three",country:"UK",lat:54.2,lng:2.1,fuelType:"wind_offshore",status:"construction",capacityMw:2852,owner:"Ørsted",commissionYear:2027,source:"BEIS",risks:JSON.stringify(["supply_chain","permitting"])},
  {id:"p043",name:"Dogger Bank A",country:"UK",lat:54.55,lng:2.02,fuelType:"wind_offshore",status:"construction",capacityMw:1200,owner:"SSE / Equinor / Vårgrønn",commissionYear:2025,source:"BEIS",risks:JSON.stringify(["supply_chain"])},
  {id:"p044",name:"Dogger Bank B",country:"UK",lat:54.65,lng:2.25,fuelType:"wind_offshore",status:"construction",capacityMw:1200,owner:"SSE / Equinor",commissionYear:2026,source:"BEIS",risks:JSON.stringify(["supply_chain"])},
  {id:"p045",name:"Walney Extension",country:"UK",lat:54.08,lng:-3.52,fuelType:"wind_offshore",status:"operating",capacityMw:659,owner:"Ørsted / PGGM",commissionYear:2018,source:"BEIS",risks:JSON.stringify([])},
  {id:"p046",name:"Gemini Wind Park",country:"Netherlands",lat:54.03,lng:5.97,fuelType:"wind_offshore",status:"operating",capacityMw:600,owner:"Northland Power",commissionYear:2017,source:"RVO",risks:JSON.stringify([])},
  {id:"p047",name:"Borssele I & II",country:"Netherlands",lat:51.62,lng:3.43,fuelType:"wind_offshore",status:"operating",capacityMw:752,owner:"Ørsted / Norges Bank",commissionYear:2021,source:"RVO",risks:JSON.stringify([])},
  {id:"p048",name:"Yunlin Offshore Wind",country:"Taiwan",lat:23.66,lng:119.85,fuelType:"wind_offshore",status:"operating",capacityMw:640,owner:"wpd",commissionYear:2022,source:"GEM",risks:JSON.stringify([])},
  {id:"p049",name:"Changhua Wind Farm",country:"Taiwan",lat:24.12,lng:120.3,fuelType:"wind_offshore",status:"construction",capacityMw:900,owner:"Ørsted",commissionYear:2025,source:"GEM",risks:JSON.stringify(["permitting"])},
  {id:"p050",name:"Vineyard Wind 1",country:"USA",lat:41.38,lng:-70.53,fuelType:"wind_offshore",status:"construction",capacityMw:800,owner:"Avangrid / Copenhagen Infrastructure",commissionYear:2025,source:"BOEM",risks:JSON.stringify(["supply_chain","legal"])},
  {id:"p051",name:"Revolution Wind",country:"USA",lat:41.25,lng:-70.8,fuelType:"wind_offshore",status:"construction",capacityMw:704,owner:"Ørsted / Eversource",commissionYear:2025,source:"BOEM",risks:JSON.stringify(["supply_chain"])},
  {id:"p052",name:"Hywind Tampen (Floating)",country:"Norway",lat:61.3,lng:3.3,fuelType:"wind_offshore",status:"operating",capacityMw:88,owner:"Equinor",commissionYear:2023,source:"NVE",risks:JSON.stringify([])},
  {id:"p053",name:"Blyth Offshore Wind A",country:"UK",lat:55.13,lng:-1.46,fuelType:"wind_offshore",status:"operating",capacityMw:34,owner:"EDF Renewables",commissionYear:2019,source:"BEIS",risks:JSON.stringify([])},
  {id:"p054",name:"EnBW He Dreiht",country:"Germany",lat:54.5,lng:7.5,fuelType:"wind_offshore",status:"construction",capacityMw:960,owner:"EnBW",commissionYear:2026,source:"BNetzA",risks:JSON.stringify(["supply_chain"])},

  // ── Nuclear ──
  {id:"p060",name:"Hinkley Point C",country:"UK",lat:51.22,lng:-3.13,fuelType:"nuclear",status:"construction",capacityMw:3260,owner:"EDF / CGN",commissionYear:2029,source:"ONR",risks:JSON.stringify(["cost_overrun","schedule_delay"])},
  {id:"p061",name:"Vogtle Units 3 & 4",country:"USA",lat:33.14,lng:-81.76,fuelType:"nuclear",status:"operating",capacityMw:2430,owner:"Georgia Power",commissionYear:2023,source:"NRC",risks:JSON.stringify([])},
  {id:"p062",name:"Akkuyu Nuclear",country:"Turkey",lat:36.14,lng:33.56,fuelType:"nuclear",status:"construction",capacityMw:4800,owner:"Rosatom",commissionYear:2026,source:"GEM",risks:JSON.stringify(["geopolitical","financing"])},
  {id:"p063",name:"Rooppur Nuclear",country:"Bangladesh",lat:24.07,lng:89.03,fuelType:"nuclear",status:"construction",capacityMw:2400,owner:"BAEC / Rosatom",commissionYear:2025,source:"GEM",risks:JSON.stringify(["financing","grid"])},
  {id:"p064",name:"Barakah Nuclear",country:"UAE",lat:23.97,lng:52.22,fuelType:"nuclear",status:"operating",capacityMw:5600,owner:"ENEC",commissionYear:2021,source:"IAEA",risks:JSON.stringify([])},
  {id:"p065",name:"Olkiluoto 3",country:"Finland",lat:61.23,lng:21.44,fuelType:"nuclear",status:"operating",capacityMw:1600,owner:"TVO",commissionYear:2023,source:"STUK",risks:JSON.stringify([])},
  {id:"p066",name:"Flamanville 3 EPR",country:"France",lat:49.53,lng:-1.88,fuelType:"nuclear",status:"operating",capacityMw:1650,owner:"EDF",commissionYear:2024,source:"ASN",risks:JSON.stringify([])},
  {id:"p067",name:"Paks II",country:"Hungary",lat:46.58,lng:18.86,fuelType:"nuclear",status:"planned",capacityMw:2400,owner:"MVM / Rosatom",commissionYear:2032,source:"GEM",risks:JSON.stringify(["geopolitical","financing","permitting"])},
  {id:"p068",name:"Dukovany II",country:"Czechia",lat:49.09,lng:16.14,fuelType:"nuclear",status:"planned",capacityMw:1200,owner:"ČEZ",commissionYear:2036,source:"GEM",risks:JSON.stringify(["permitting","financing"])},
  {id:"p069",name:"Kanupp K-3",country:"Pakistan",lat:24.84,lng:66.77,fuelType:"nuclear",status:"operating",capacityMw:1100,owner:"PAEC",commissionYear:2022,source:"IAEA",risks:JSON.stringify([])},
  {id:"p070",name:"Tianwan Phase 3&4",country:"China",lat:34.72,lng:119.47,fuelType:"nuclear",status:"operating",capacityMw:2300,owner:"JNNPC / Rosatom",commissionYear:2021,source:"IAEA",risks:JSON.stringify([])},

  // ── Nuclear SMR ──
  {id:"p075",name:"Akademik Lomonosov (Floating SMR)",country:"Russia",lat:69.71,lng:170.29,fuelType:"nuclear_smr",status:"operating",capacityMw:70,owner:"Rosatom",commissionYear:2020,source:"IAEA",risks:JSON.stringify([])},
  {id:"p076",name:"Rolls-Royce SMR Wylfa",country:"UK",lat:53.42,lng:-4.46,fuelType:"nuclear_smr",status:"planned",capacityMw:470,owner:"Rolls-Royce / HMG",commissionYear:2031,source:"ONR",risks:JSON.stringify(["regulatory","financing"])},
  {id:"p077",name:"NuScale UAMPS Carbon Free",country:"USA",lat:43.6,lng:-112.7,fuelType:"nuclear_smr",status:"planned",capacityMw:462,owner:"NuScale / UAMPS",commissionYear:2030,source:"NRC",risks:JSON.stringify(["cost","regulatory"])},
  {id:"p078",name:"Bilibino Nuclear (micro)",country:"Russia",lat:68.05,lng:166.43,fuelType:"nuclear_smr",status:"operating",capacityMw:48,owner:"Rosenergoatom",commissionYear:1974,source:"IAEA",risks:JSON.stringify(["age"])},
  {id:"p079",name:"Fermi Energia SMR",country:"Estonia",lat:59.44,lng:24.75,fuelType:"nuclear_smr",status:"planned",capacityMw:300,owner:"Fermi Energia",commissionYear:2035,source:"GEM",risks:JSON.stringify(["regulatory","financing"])},

  // ── Coal ──
  {id:"p080",name:"Taichung Power Plant",country:"Taiwan",lat:24.27,lng:120.52,fuelType:"coal",status:"operating",capacityMw:5500,owner:"Taiwan Power",commissionYear:1992,source:"GEM",risks:JSON.stringify(["carbon_regulation","phase_out"])},
  {id:"p081",name:"Datang Tuoketuo",country:"China",lat:40.5,lng:111.1,fuelType:"coal",status:"operating",capacityMw:6720,owner:"China Datang",commissionYear:2006,source:"GEM",risks:JSON.stringify(["carbon_regulation"])},
  {id:"p082",name:"Mundra Ultra Mega Power",country:"India",lat:22.83,lng:69.72,fuelType:"coal",status:"operating",capacityMw:4620,owner:"Adani Power",commissionYear:2013,source:"GEM",risks:JSON.stringify(["coal_import","carbon_regulation"])},
  {id:"p083",name:"Matla Power Station",country:"South Africa",lat:-26.4,lng:29.37,fuelType:"coal",status:"operating",capacityMw:3558,owner:"Eskom",commissionYear:1983,source:"GEM",risks:JSON.stringify(["age","carbon_regulation","water_stress"])},
  {id:"p084",name:"Drax Power Station",country:"UK",lat:53.73,lng:-0.99,fuelType:"biomass",status:"operating",capacityMw:2595,owner:"Drax Group",commissionYear:2016,source:"BEIS",risks:JSON.stringify(["subsidy_risk","supply_chain"])},
  {id:"p085",name:"Medupi Power Station",country:"South Africa",lat:-23.72,lng:28.51,fuelType:"coal",status:"operating",capacityMw:4764,owner:"Eskom",commissionYear:2019,source:"GEM",risks:JSON.stringify(["cost_overrun","water_stress","carbon_regulation"])},
  {id:"p086",name:"Kozienice Power Plant",country:"Poland",lat:51.58,lng:21.58,fuelType:"coal",status:"operating",capacityMw:3050,owner:"Enea Wytwarzanie",commissionYear:1972,source:"GEM",risks:JSON.stringify(["carbon_regulation","phase_out"])},
  {id:"p087",name:"Belchatow Power Plant",country:"Poland",lat:51.26,lng:19.33,fuelType:"coal",status:"operating",capacityMw:5420,owner:"PGE",commissionYear:1981,source:"GEM",risks:JSON.stringify(["carbon_regulation","phase_out"])},
  {id:"p088",name:"Neurath Power Plant",country:"Germany",lat:51.03,lng:6.59,fuelType:"coal",status:"operating",capacityMw:4400,owner:"RWE",commissionYear:2012,source:"BNetzA",risks:JSON.stringify(["phase_out","carbon_price"])},
  {id:"p089",name:"Eemshaven Coal",country:"Netherlands",lat:53.44,lng:6.84,fuelType:"coal",status:"operating",capacityMw:1560,owner:"RWE",commissionYear:2015,source:"RVO",risks:JSON.stringify(["phase_out"])},

  // ── Gas ──
  {id:"p090",name:"Kapco Power Plant",country:"Pakistan",lat:31.36,lng:72.38,fuelType:"gas",status:"operating",capacityMw:1600,owner:"Kot Addu Power Company",commissionYear:2000,source:"GEM",risks:JSON.stringify(["gas_supply"])},
  {id:"p091",name:"Tamar Gas Project (power)",country:"Israel",lat:31.67,lng:34.6,fuelType:"gas",status:"operating",capacityMw:1500,owner:"Noble Energy / Delek",commissionYear:2013,source:"GEM",risks:JSON.stringify(["geopolitical"])},
  {id:"p092",name:"Pembroke Power Station",country:"UK",lat:51.68,lng:-4.99,fuelType:"gas",status:"operating",capacityMw:2188,owner:"RWE",commissionYear:2012,source:"BEIS",risks:JSON.stringify(["carbon_price"])},
  {id:"p093",name:"Bouchain CCGT",country:"France",lat:50.27,lng:3.32,fuelType:"gas",status:"operating",capacityMw:575,owner:"EDF",commissionYear:2016,source:"GEM",risks:JSON.stringify([])},
  {id:"p094",name:"Lausward Fortuna CCGT",country:"Germany",lat:51.22,lng:6.74,fuelType:"gas",status:"operating",capacityMw:595,owner:"Stadtwerke Düsseldorf",commissionYear:2016,source:"BNetzA",risks:JSON.stringify([])},
  {id:"p095",name:"Sutton Bridge Power",country:"UK",lat:52.76,lng:0.19,fuelType:"gas",status:"operating",capacityMw:819,owner:"EDF Energy",commissionYear:1999,source:"BEIS",risks:JSON.stringify(["carbon_price"])},
  {id:"p096",name:"SEGS Los Angeles",country:"USA",lat:34.79,lng:-117.47,fuelType:"gas",status:"operating",capacityMw:354,owner:"NextEra Energy",commissionYear:1991,source:"EIA",risks:JSON.stringify([])},
  {id:"p097",name:"Sabine Pass LNG (power)",country:"USA",lat:29.73,lng:-93.87,fuelType:"gas",status:"operating",capacityMw:600,owner:"Cheniere Energy",commissionYear:2016,source:"FERC",risks:JSON.stringify([])},

  // ── Hydro ──
  {id:"p100",name:"Three Gorges Dam",country:"China",lat:30.82,lng:111.0,fuelType:"hydro",status:"operating",capacityMw:22500,owner:"China Three Gorges Corp",commissionYear:2012,source:"GEM",risks:JSON.stringify(["drought","sedimentation"])},
  {id:"p101",name:"Itaipu Dam",country:"Brazil",lat:-25.41,lng:-54.59,fuelType:"hydro",status:"operating",capacityMw:14000,owner:"Itaipu Binacional",commissionYear:1984,source:"GEM",risks:JSON.stringify(["drought"])},
  {id:"p102",name:"Belo Monte",country:"Brazil",lat:-3.2,lng:-51.92,fuelType:"hydro",status:"operating",capacityMw:11233,owner:"Norte Energia",commissionYear:2019,source:"GEM",risks:JSON.stringify(["drought","environmental"])},
  {id:"p103",name:"Grand Coulee Dam",country:"USA",lat:47.96,lng:-118.98,fuelType:"hydro",status:"operating",capacityMw:6809,owner:"USBR",commissionYear:1942,source:"EIA",risks:JSON.stringify(["drought","age"])},
  {id:"p104",name:"Robert-Bourassa Hydroelectric",country:"Canada",lat:53.65,lng:-77.65,fuelType:"hydro",status:"operating",capacityMw:5616,owner:"Hydro-Québec",commissionYear:1981,source:"GEM",risks:JSON.stringify([])},
  {id:"p105",name:"Snowy 2.0 Pumped Hydro",country:"Australia",lat:-36.0,lng:148.3,fuelType:"hydro",status:"construction",capacityMw:2000,owner:"Snowy Hydro",commissionYear:2028,source:"AEMO",risks:JSON.stringify(["cost_overrun","schedule_delay"])},
  {id:"p106",name:"Grand Ethiopian Renaissance Dam",country:"Ethiopia",lat:11.21,lng:35.09,fuelType:"hydro",status:"operating",capacityMw:5150,owner:"EEPCO",commissionYear:2022,source:"GEM",risks:JSON.stringify(["geopolitical","drought"])},
  {id:"p107",name:"Isimba Hydropower Plant",country:"Uganda",lat:0.76,lng:33.15,fuelType:"hydro",status:"operating",capacityMw:183,owner:"UEGCL",commissionYear:2019,source:"GEM",risks:JSON.stringify([])},
  {id:"p108",name:"Cahora Bassa Dam",country:"Mozambique",lat:-15.6,lng:32.7,fuelType:"hydro",status:"operating",capacityMw:2075,owner:"HCB",commissionYear:1975,source:"GEM",risks:JSON.stringify(["drought","age"])},

  // ── Geothermal ──
  {id:"p110",name:"The Geysers",country:"USA",lat:38.78,lng:-122.75,fuelType:"geothermal",status:"operating",capacityMw:725,owner:"Calpine Corporation",commissionYear:1960,source:"EIA",risks:JSON.stringify([])},
  {id:"p111",name:"Hellisheidi Geothermal",country:"Iceland",lat:64.05,lng:-21.4,fuelType:"geothermal",status:"operating",capacityMw:303,owner:"ON Power",commissionYear:2006,source:"GEM",risks:JSON.stringify([])},
  {id:"p112",name:"Olkaria IV",country:"Kenya",lat:-0.89,lng:36.27,fuelType:"geothermal",status:"operating",capacityMw:140,owner:"KenGen",commissionYear:2014,source:"GEM",risks:JSON.stringify([])},
  {id:"p113",name:"Wairakei Geothermal",country:"New Zealand",lat:-38.63,lng:176.1,fuelType:"geothermal",status:"operating",capacityMw:166,owner:"Contact Energy",commissionYear:1958,source:"GEM",risks:JSON.stringify([])},
  {id:"p114",name:"Cerro Prieto Geothermal",country:"Mexico",lat:32.42,lng:-115.3,fuelType:"geothermal",status:"operating",capacityMw:720,owner:"CFE",commissionYear:1973,source:"GEM",risks:JSON.stringify([])},
  {id:"p115",name:"Sarulla Geothermal",country:"Indonesia",lat:1.75,lng:99.0,fuelType:"geothermal",status:"operating",capacityMw:330,owner:"SGL",commissionYear:2018,source:"GEM",risks:JSON.stringify([])},

  // ── Storage ──
  {id:"p120",name:"Hornsdale Power Reserve",country:"Australia",lat:-33.07,lng:138.38,fuelType:"storage",status:"operating",capacityMw:150,owner:"Neoen / Tesla",commissionYear:2017,source:"AEMO",risks:JSON.stringify([])},
  {id:"p121",name:"Moss Landing BESS",country:"USA",lat:36.8,lng:-121.79,fuelType:"storage",status:"operating",capacityMw:400,owner:"Vistra Energy",commissionYear:2021,source:"CAISO",risks:JSON.stringify(["fire_risk"])},
  {id:"p122",name:"Edwards & Sanborn Solar+Storage",country:"USA",lat:34.93,lng:-118.0,fuelType:"storage",status:"operating",capacityMw:1080,owner:"Terra-Gen",commissionYear:2023,source:"CAISO",risks:JSON.stringify([])},
  {id:"p123",name:"Crimson Battery Storage",country:"USA",lat:33.72,lng:-114.66,fuelType:"storage",status:"operating",capacityMw:350,owner:"8minute Solar",commissionYear:2022,source:"CAISO",risks:JSON.stringify([])},
  {id:"p124",name:"Nant de Drance Pumped Storage",country:"Switzerland",lat:46.07,lng:7.24,fuelType:"storage",status:"operating",capacityMw:900,owner:"Alpiq / Axpo",commissionYear:2022,source:"GEM",risks:JSON.stringify([])},
  {id:"p125",name:"Dinorwig Power Station",country:"UK",lat:53.12,lng:-4.1,fuelType:"storage",status:"operating",capacityMw:1728,owner:"First Hydro Company",commissionYear:1984,source:"BEIS",risks:JSON.stringify([])},
  {id:"p126",name:"Liquid Air Energy Storage Highview",country:"UK",lat:53.52,lng:-2.22,fuelType:"storage",status:"planned",capacityMw:50,owner:"Highview Power",commissionYear:2026,source:"BEIS",risks:JSON.stringify(["financing","regulatory"])},

  // ── Hydrogen ──
  {id:"p130",name:"NEOM Green Hydrogen",country:"Saudi Arabia",lat:28.0,lng:35.0,fuelType:"hydrogen",status:"construction",capacityMw:4000,owner:"NEOM / Air Products / ACWA Power",commissionYear:2026,source:"GEM",risks:JSON.stringify(["cost","market","financing"])},
  {id:"p131",name:"Hy Caledonia H2",country:"UK",lat:55.86,lng:-4.25,fuelType:"hydrogen",status:"planned",capacityMw:20,owner:"Ineos",commissionYear:2027,source:"BEIS",risks:JSON.stringify(["regulatory","financing"])},
  {id:"p132",name:"HyNet North West",country:"UK",lat:53.4,lng:-2.5,fuelType:"hydrogen",status:"planned",capacityMw:200,owner:"CF Industries / Essar",commissionYear:2027,source:"BEIS",risks:JSON.stringify(["regulatory","ccs_dependency"])},
  {id:"p133",name:"Sinopec Kuqa Green Hydrogen",country:"China",lat:41.7,lng:82.9,fuelType:"hydrogen",status:"operating",capacityMw:260,owner:"Sinopec",commissionYear:2023,source:"GEM",risks:JSON.stringify([])},
  {id:"p134",name:"Orca Direct Air Capture",country:"Iceland",lat:64.05,lng:-22.0,fuelType:"ccs",status:"operating",capacityMw:4,owner:"Climeworks",commissionYear:2021,source:"GEM",risks:JSON.stringify(["cost","scale"])},

  // ── CCS ──
  {id:"p140",name:"Sleipner CCS",country:"Norway",lat:58.38,lng:1.9,fuelType:"ccs",status:"operating",capacityMw:100,owner:"Equinor",commissionYear:1996,source:"GEM",risks:JSON.stringify([])},
  {id:"p141",name:"Boundary Dam CCS",country:"Canada",lat:49.27,lng:-103.7,fuelType:"ccs",status:"operating",capacityMw:110,owner:"SaskPower",commissionYear:2014,source:"GEM",risks:JSON.stringify(["cost","performance"])},
  {id:"p142",name:"Drax BECCS",country:"UK",lat:53.73,lng:-0.99,fuelType:"ccs",status:"planned",capacityMw:560,owner:"Drax Group",commissionYear:2030,source:"BEIS",risks:JSON.stringify(["financing","regulatory","subsidy"])},
  {id:"p143",name:"Northern Lights CCS Hub",country:"Norway",lat:60.7,lng:4.7,fuelType:"ccs",status:"operating",capacityMw:150,owner:"Equinor / Shell / TotalEnergies",commissionYear:2024,source:"GEM",risks:JSON.stringify([])},
  {id:"p144",name:"Quest CCS",country:"Canada",lat:57.0,lng:-111.5,fuelType:"ccs",status:"operating",capacityMw:200,owner:"Shell",commissionYear:2015,source:"GEM",risks:JSON.stringify([])},

  // ── LNG ──
  {id:"p150",name:"Yamal LNG",country:"Russia",lat:71.57,lng:72.63,fuelType:"lng",status:"operating",capacityMw:2500,owner:"Novatek / Total / CNPC",commissionYear:2017,source:"GEM",risks:JSON.stringify(["geopolitical","sanctions"])},
  {id:"p151",name:"Sabine Pass LNG Terminal",country:"USA",lat:29.73,lng:-93.9,fuelType:"lng",status:"operating",capacityMw:5000,owner:"Cheniere Energy",commissionYear:2016,source:"FERC",risks:JSON.stringify([])},
  {id:"p152",name:"Freeport LNG",country:"USA",lat:28.94,lng:-95.35,fuelType:"lng",status:"operating",capacityMw:2500,owner:"Freeport LNG Development",commissionYear:2019,source:"FERC",risks:JSON.stringify([])},
  {id:"p153",name:"Qatar Gas LNG Ras Laffan",country:"Qatar",lat:25.93,lng:51.55,fuelType:"lng",status:"operating",capacityMw:7700,owner:"QatarEnergy",commissionYear:1997,source:"GEM",risks:JSON.stringify([])},
  {id:"p154",name:"Gorgon LNG",country:"Australia",lat:-21.96,lng:114.15,fuelType:"lng",status:"operating",capacityMw:4500,owner:"Chevron / Shell / ExxonMobil",commissionYear:2016,source:"AEMO",risks:JSON.stringify(["ccs_underperformance"])},
  {id:"p155",name:"Deutsche ReGas FSRU Lubmin",country:"Germany",lat:54.16,lng:13.66,fuelType:"lng",status:"operating",capacityMw:300,owner:"Deutsche ReGas",commissionYear:2022,source:"BNetzA",risks:JSON.stringify([])},
  {id:"p156",name:"GNL Quintero",country:"Chile",lat:-32.77,lng:-71.55,fuelType:"lng",status:"operating",capacityMw:400,owner:"Enagás / BG Group",commissionYear:2009,source:"GEM",risks:JSON.stringify([])},

  // ── Oil ──
  {id:"p160",name:"Aramco Ras Tanura Refinery Power",country:"Saudi Arabia",lat:26.6,lng:50.17,fuelType:"oil",status:"operating",capacityMw:1800,owner:"Saudi Aramco",commissionYear:1975,source:"GEM",risks:JSON.stringify(["carbon_regulation"])},
  {id:"p161",name:"Kuwait Olefins Shuaiba",country:"Kuwait",lat:29.04,lng:48.13,fuelType:"oil",status:"operating",capacityMw:2200,owner:"PIC",commissionYear:2008,source:"GEM",risks:JSON.stringify(["carbon_regulation"])},

  // ── Biomass ──
  {id:"p165",name:"Alholmens Kraft Biomass",country:"Finland",lat:63.97,lng:23.49,fuelType:"biomass",status:"operating",capacityMw:265,owner:"Vattenfall",commissionYear:2002,source:"GEM",risks:JSON.stringify([])},
  {id:"p166",name:"Ironbridge Biomass",country:"UK",lat:52.63,lng:-2.47,fuelType:"biomass",status:"retired",capacityMw:740,owner:"E.ON",commissionYear:2013,source:"BEIS",risks:JSON.stringify([])},
  {id:"p167",name:"MGT Teesside Biomass",country:"UK",lat:54.59,lng:-1.17,fuelType:"biomass",status:"operating",capacityMw:299,owner:"MGT Power",commissionYear:2022,source:"BEIS",risks:JSON.stringify(["supply_chain"])},

  // ── Tidal ──
  {id:"p170",name:"Sihwa Tidal Power Station",country:"South Korea",lat:37.32,lng:126.6,fuelType:"tidal",status:"operating",capacityMw:254,owner:"Korea Water Resources Corp",commissionYear:2011,source:"GEM",risks:JSON.stringify([])},
  {id:"p171",name:"Rance Tidal Barrage",country:"France",lat:48.52,lng:-2.01,fuelType:"tidal",status:"operating",capacityMw:240,owner:"EDF",commissionYear:1966,source:"GEM",risks:JSON.stringify(["age"])},
  {id:"p172",name:"MeyGen Tidal Stream",country:"UK",lat:58.65,lng:-3.18,fuelType:"tidal",status:"operating",capacityMw:6,owner:"Atlantis Resources",commissionYear:2017,source:"BEIS",risks:JSON.stringify([])},
  {id:"p173",name:"Orbital O2 Tidal",country:"UK",lat:56.45,lng:-2.92,fuelType:"tidal",status:"operating",capacityMw:2,owner:"Orbital Marine Power",commissionYear:2021,source:"BEIS",risks:JSON.stringify([])},

  // ── Additional diverse projects ──
  {id:"p180",name:"São Paulo Solar Park",country:"Brazil",lat:-23.55,lng:-46.63,fuelType:"solar",status:"planned",capacityMw:400,owner:"Eneva",commissionYear:2026,source:"GEM",risks:JSON.stringify(["permitting"])},
  {id:"p181",name:"South Africa Renewable Zone",country:"South Africa",lat:-28.0,lng:23.0,fuelType:"solar",status:"planned",capacityMw:1500,owner:"REIPPPP",commissionYear:2027,source:"GEM",risks:JSON.stringify(["grid","permitting"])},
  {id:"p182",name:"Sakaka Solar PV",country:"Saudi Arabia",lat:29.97,lng:40.18,fuelType:"solar",status:"operating",capacityMw:300,owner:"ACWA Power",commissionYear:2019,source:"GEM",risks:JSON.stringify([])},
  {id:"p183",name:"Benban Solar Park",country:"Egypt",lat:24.45,lng:32.73,fuelType:"solar",status:"operating",capacityMw:1650,owner:"Various",commissionYear:2019,source:"GEM",risks:JSON.stringify(["grid"])},
  {id:"p184",name:"Kiamal Solar Farm",country:"Australia",lat:-35.0,lng:142.3,fuelType:"solar",status:"operating",capacityMw:200,owner:"Total Eren",commissionYear:2021,source:"AEMO",risks:JSON.stringify([])},
  {id:"p185",name:"Longyuan Rudong Offshore Wind",country:"China",lat:32.4,lng:121.4,fuelType:"wind_offshore",status:"operating",capacityMw:600,owner:"China Longyuan Power",commissionYear:2013,source:"GEM",risks:JSON.stringify([])},
  {id:"p186",name:"South Fork Wind",country:"USA",lat:40.89,lng:-71.41,fuelType:"wind_offshore",status:"operating",capacityMw:132,owner:"Ørsted / Eversource",commissionYear:2024,source:"BOEM",risks:JSON.stringify([])},
  {id:"p187",name:"Baltic Eagle Offshore Wind",country:"Germany",lat:54.4,lng:14.0,fuelType:"wind_offshore",status:"operating",capacityMw:476,owner:"Iberdrola",commissionYear:2024,source:"BNetzA",risks:JSON.stringify([])},
  {id:"p188",name:"Triton Knoll",country:"UK",lat:53.38,lng:0.73,fuelType:"wind_offshore",status:"operating",capacityMw:857,owner:"innogy / J-Power / Macquarie",commissionYear:2022,source:"BEIS",risks:JSON.stringify([])},
  {id:"p189",name:"Seagreen Wind Energy",country:"UK",lat:56.42,lng:-0.68,fuelType:"wind_offshore",status:"operating",capacityMw:1075,owner:"SSE / TotalEnergies",commissionYear:2023,source:"BEIS",risks:JSON.stringify([])},
  {id:"p190",name:"Neart Na Gaoithe",country:"UK",lat:56.17,lng:-2.45,fuelType:"wind_offshore",status:"operating",capacityMw:448,owner:"EDF Renewables",commissionYear:2023,source:"BEIS",risks:JSON.stringify([])},
  {id:"p191",name:"Sofia Offshore Wind",country:"UK",lat:54.8,lng:2.2,fuelType:"wind_offshore",status:"construction",capacityMw:1400,owner:"RWE",commissionYear:2026,source:"BEIS",risks:JSON.stringify(["supply_chain"])},
  {id:"p192",name:"East Anglia 3 Offshore Wind",country:"UK",lat:52.45,lng:2.8,fuelType:"wind_offshore",status:"planned",capacityMw:1400,owner:"ScottishPower Renewables",commissionYear:2028,source:"BEIS",risks:JSON.stringify(["permitting","grid"])},
  {id:"p193",name:"Kaskasi Offshore Wind",country:"Germany",lat:54.37,lng:7.81,fuelType:"wind_offshore",status:"operating",capacityMw:342,owner:"RWE",commissionYear:2022,source:"BNetzA",risks:JSON.stringify([])},
  {id:"p194",name:"Ekwulobia Solar",country:"Nigeria",lat:5.79,lng:7.12,fuelType:"solar",status:"construction",capacityMw:100,owner:"Nigerian Electricity Authority",commissionYear:2025,source:"GEM",risks:JSON.stringify(["grid","financing"])},
  {id:"p195",name:"Lake Turkana Wind Power",country:"Kenya",lat:3.2,lng:36.4,fuelType:"wind",status:"operating",capacityMw:310,owner:"Lake Turkana Wind Power",commissionYear:2018,source:"GEM",risks:JSON.stringify([])},
  {id:"p196",name:"Sidrap Wind Farm",country:"Indonesia",lat:-3.99,lng:119.68,fuelType:"wind",status:"operating",capacityMw:75,owner:"UPC / PT Binatek",commissionYear:2018,source:"GEM",risks:JSON.stringify([])},
  {id:"p197",name:"Nura Wind",country:"Kazakhstan",lat:49.9,lng:72.8,fuelType:"wind",status:"operating",capacityMw:100,owner:"Enel Green Power",commissionYear:2021,source:"GEM",risks:JSON.stringify([])},
  {id:"p198",name:"Zhang北 Wind-Solar Hybrid",country:"China",lat:41.2,lng:114.5,fuelType:"solar",status:"operating",capacityMw:2200,owner:"State Power Investment Corp",commissionYear:2022,source:"GEM",risks:JSON.stringify([])},
  {id:"p199",name:"Moray East Offshore Wind",country:"UK",lat:57.74,lng:-2.9,fuelType:"wind_offshore",status:"operating",capacityMw:950,owner:"Ocean Winds / EDP",commissionYear:2022,source:"BEIS",risks:JSON.stringify([])},
  {id:"p200",name:"Lincs Offshore Wind Farm",country:"UK",lat:53.13,lng:0.5,fuelType:"wind_offshore",status:"operating",capacityMw:270,owner:"Centrica / Siemens / Dong",commissionYear:2013,source:"BEIS",risks:JSON.stringify([])}
];

// ─── Derived stats ─────────────────────────────────────────────────────────────
function buildStats() {
  const byFuelType = {};
  const byStatus = {};
  let totalCapacityMw = 0;

  PROJECTS.forEach(p => {
    byFuelType[p.fuelType] = (byFuelType[p.fuelType] || 0) + 1;
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    totalCapacityMw += p.capacityMw || 0;
  });

  return {
    total: PROJECTS.length,
    totalCapacityMw: Math.round(totalCapacityMw),
    byFuelType,
    byStatus,
    lastUpdated: new Date().toISOString()
  };
}

// ─── Infrastructure data ───────────────────────────────────────────────────────
const INFRA = [
  {id:"i001",name:"Nord Stream 1 (offline)",type:"gas_pipeline",status:"retired",coords:[[55.1,12.5],[55.4,14.0],[55.7,16.5],[56.0,19.0],[56.5,22.0],[57.0,25.0],[57.5,27.5],[58.0,29.5],[58.5,30.5],[59.0,31.4]],description:"Baltic Sea pipeline, shut down 2022"},
  {id:"i002",name:"Baltic Pipe",type:"gas_pipeline",status:"operating",coords:[[57.7,10.5],[57.4,12.0],[56.9,14.0],[56.5,15.5],[55.5,16.5],[54.5,17.5],[54.0,18.5]],description:"Norway-Poland gas pipeline via Denmark"},
  {id:"i003",name:"NordBalt HVDC Cable",type:"hvdc_cable",status:"operating",coords:[[55.6,21.2],[56.0,20.5],[56.5,19.5],[57.0,18.5],[57.5,18.0],[58.0,17.5],[58.5,17.0],[59.5,17.5]],description:"Lithuania-Sweden 700 MW interconnector"},
  {id:"i004",name:"BritNed HVDC",type:"hvdc_cable",status:"operating",coords:[[51.9,4.0],[51.7,3.5],[51.5,3.0],[51.3,2.5],[51.1,1.7],[50.9,1.2],[50.7,0.5],[50.5,0.0],[51.0,-0.3],[51.5,-0.5]],description:"Netherlands-UK 1000 MW HVDC link"},
  {id:"i005",name:"IFA2 HVDC (UK-France)",type:"hvdc_cable",status:"operating",coords:[[50.9,-0.1],[50.5,0.3],[50.1,1.0],[49.8,1.6]],description:"1000 MW UK-France subsea interconnector"},
  {id:"i006",name:"ElecLink (UK-France)",type:"hvdc_cable",status:"operating",coords:[[51.2,1.2],[50.9,1.6],[50.5,2.0]],description:"1000 MW via Channel Tunnel"},
  {id:"i007",name:"EuroAsia Interconnector",type:"hvdc_cable",status:"planned",coords:[[38.0,23.7],[36.5,25.5],[35.2,27.5],[34.5,30.0],[33.0,32.5],[32.5,34.8]],description:"Greece-Cyprus-Israel 2000 MW HVDC, world's longest subsea cable"},
  {id:"i008",name:"Morocco-UK Power Line",type:"hvdc_cable",status:"planned",coords:[[32.0,-5.0],[30.0,-10.0],[27.0,-13.5],[20.0,-17.0],[15.0,-18.0],[10.0,-17.0],[5.0,-10.0],[2.0,-5.0],[0.0,0.5],[48.0,-2.0],[51.0,-1.0]],description:"Xlinks 3.6 GW HVDC Morocco to UK"},
  {id:"i009",name:"Langeled Gas Pipeline",type:"gas_pipeline",status:"operating",coords:[[59.3,2.5],[59.5,1.0],[59.0,0.0],[58.5,-0.5],[57.5,-0.8],[56.0,-0.5],[54.5,-0.3],[53.7,0.2]],description:"Norway-UK gas pipeline, largest subsea gas pipeline"},
  {id:"i010",name:"TAP (Trans Adriatic Pipeline)",type:"gas_pipeline",status:"operating",coords:[[41.7,47.0],[41.2,44.0],[41.0,41.5],[40.5,39.0],[40.0,36.0],[39.7,33.5],[39.5,30.5],[39.3,27.5],[39.7,23.5],[40.5,20.5],[41.3,19.5],[41.8,18.0]],description:"Caspian gas to Europe via Greece/Albania"},
  {id:"i011",name:"NSLink (Norway-Scotland HVDC)",type:"hvdc_cable",status:"planned",coords:[[58.2,7.6],[58.5,5.5],[58.9,3.0],[58.6,1.0],[58.1,-1.5],[57.5,-3.2]],description:"1400 MW planned Norway-Scotland interconnector"},
  {id:"i012",name:"Viking Link HVDC",type:"hvdc_cable",status:"operating",coords:[[57.0,9.5],[56.5,8.5],[55.7,7.0],[54.7,5.5],[53.8,4.0],[53.5,2.5],[53.2,1.0],[53.5,-0.2]],description:"Denmark-UK 1400 MW, world's longest land+offshore HVDC"},
  {id:"i013",name:"H2Med Hydrogen Pipeline",type:"hydrogen_pipeline",status:"planned",coords:[[38.7,-9.1],[38.0,-7.0],[37.5,-5.5],[37.1,-3.7],[36.8,-2.5],[36.5,-1.0],[36.5,0.5],[37.0,2.5],[38.0,4.5],[39.5,6.0],[41.5,7.5],[43.5,7.5],[44.5,6.5],[46.0,5.0],[47.0,4.0],[48.8,2.3]],description:"Planned green hydrogen pipeline Portugal-Spain-France"},
  {id:"i014",name:"East-West Gas Interconnector",type:"gas_pipeline",status:"operating",coords:[[53.4,-6.2],[53.2,-4.5],[53.0,-3.0],[52.7,-2.0],[52.5,-1.0]],description:"Ireland to UK gas link"},
];

// ─── Country profiles ──────────────────────────────────────────────────────────
const COUNTRIES = {
  UK: { netZeroTarget: "2050", renewablesPct: 45, nuclearPct: 15, fossilPct: 40, totalInstalledGw: 120, co2IntensityGCO2kwh: 180, topFuels: [{fuel:"wind_offshore",pct:22},{fuel:"wind",pct:15},{fuel:"gas",pct:35},{fuel:"nuclear",pct:15},{fuel:"solar",pct:8}], keyPolicy: "Contracts for Difference (CfD), Great British Energy sovereign company" },
  Norway: { netZeroTarget: "2050", renewablesPct: 98, nuclearPct: 0, fossilPct: 2, totalInstalledGw: 40, co2IntensityGCO2kwh: 20, topFuels: [{fuel:"hydro",pct:88},{fuel:"wind",pct:10},{fuel:"solar",pct:1}], keyPolicy: "Oil Fund (GPFG) reinvestment in offshore wind" },
  Germany: { netZeroTarget: "2045", renewablesPct: 52, nuclearPct: 0, fossilPct: 48, totalInstalledGw: 258, co2IntensityGCO2kwh: 380, topFuels: [{fuel:"wind",pct:27},{fuel:"solar",pct:12},{fuel:"gas",pct:15},{fuel:"coal",pct:26},{fuel:"biomass",pct:8}], keyPolicy: "Energiewende, EEG feed-in system, 80% renewables by 2030" },
  France: { netZeroTarget: "2050", renewablesPct: 25, nuclearPct: 68, fossilPct: 7, totalInstalledGw: 155, co2IntensityGCO2kwh: 50, topFuels: [{fuel:"nuclear",pct:68},{fuel:"hydro",pct:12},{fuel:"wind",pct:9},{fuel:"solar",pct:5}], keyPolicy: "Nouveau nucléaire: 6 EPR2 reactors ordered" },
  USA: { netZeroTarget: "2050", renewablesPct: 23, nuclearPct: 19, fossilPct: 58, totalInstalledGw: 1260, co2IntensityGCO2kwh: 380, topFuels: [{fuel:"gas",pct:40},{fuel:"nuclear",pct:19},{fuel:"wind",pct:11},{fuel:"coal",pct:16},{fuel:"solar",pct:5}], keyPolicy: "Inflation Reduction Act: $369bn clean energy incentives" },
  China: { netZeroTarget: "2060", renewablesPct: 31, nuclearPct: 5, fossilPct: 64, totalInstalledGw: 2700, co2IntensityGCO2kwh: 540, topFuels: [{fuel:"coal",pct:59},{fuel:"hydro",pct:16},{fuel:"wind",pct:8},{fuel:"nuclear",pct:5},{fuel:"solar",pct:6}], keyPolicy: "Dual Carbon Goal: peak 2030, neutrality 2060; 1200 GW wind+solar by 2030" },
  India: { netZeroTarget: "2070", renewablesPct: 22, nuclearPct: 2, fossilPct: 76, totalInstalledGw: 500, co2IntensityGCO2kwh: 620, topFuels: [{fuel:"coal",pct:70},{fuel:"hydro",pct:10},{fuel:"solar",pct:7},{fuel:"wind",pct:6}], keyPolicy: "500 GW non-fossil target by 2030, National Mission on Clean Energy" },
  Australia: { netZeroTarget: "2050", renewablesPct: 35, nuclearPct: 0, fossilPct: 65, totalInstalledGw: 95, co2IntensityGCO2kwh: 420, topFuels: [{fuel:"coal",pct:48},{fuel:"gas",pct:17},{fuel:"wind",pct:11},{fuel:"solar",pct:14},{fuel:"hydro",pct:6}], keyPolicy: "Capacity Investment Scheme, Rewiring the Nation $20bn" },
  "Saudi Arabia": { netZeroTarget: "2060", renewablesPct: 2, nuclearPct: 0, fossilPct: 98, totalInstalledGw: 80, co2IntensityGCO2kwh: 710, topFuels: [{fuel:"gas",pct:60},{fuel:"oil",pct:38},{fuel:"solar",pct:2}], keyPolicy: "Vision 2030: 50% renewables by 2030, NEOM mega-project" },
  Netherlands: { netZeroTarget: "2050", renewablesPct: 30, nuclearPct: 3, fossilPct: 67, totalInstalledGw: 50, co2IntensityGCO2kwh: 330, topFuels: [{fuel:"gas",pct:55},{fuel:"wind_offshore",pct:12},{fuel:"wind",pct:7},{fuel:"solar",pct:9},{fuel:"nuclear",pct:3}], keyPolicy: "North Sea Energy Cooperation, 21 GW offshore wind by 2030" },
  UAE: { netZeroTarget: "2050", renewablesPct: 5, nuclearPct: 20, fossilPct: 75, totalInstalledGw: 55, co2IntensityGCO2kwh: 350, topFuels: [{fuel:"gas",pct:72},{fuel:"nuclear",pct:20},{fuel:"solar",pct:5}], keyPolicy: "Net Zero 2050 Strategic Initiative, 44% clean energy by 2050" },
};

// ─── Router ────────────────────────────────────────────────────────────────────
function handleApi(url) {
  // Normalise URL to a path
  let path = url;
  try { path = new URL(url).pathname; } catch {}

  // Strip the port/5000 prefix that the bundled JS emits
  path = path.replace(/^\/?(port\/5000)?/, '').replace(/^\//, '');

  const NO_CACHE = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Content-Type': 'application/json'
  };

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: NO_CACHE });

  // GET /api/projects
  if (path === 'api/projects') return json(PROJECTS);

  // GET /api/stats
  if (path === 'api/stats') return json(buildStats());

  // GET /api/infra
  if (path === 'api/infra') return json(INFRA);

  // GET /api/annotations  (client-side only; persisted in localStorage if needed)
  if (path === 'api/annotations') return json([]);

  // DELETE /api/annotations/:id  — no-op
  if (path.startsWith('api/annotations/')) return json({ ok: true });

  // POST /api/annotations  — echo back
  // (handled by fetch intercept below)

  // GET /api/country/:id
  const countryMatch = path.match(/^api\/country\/(.+)$/);
  if (countryMatch) {
    const id = decodeURIComponent(countryMatch[1]);
    const profile = COUNTRIES[id];
    if (profile) return json(profile);
    return json({ error: 'Not found' }, 404);
  }

  // GET /api/export/csv
  if (path === 'api/export/csv' || path.startsWith('api/export/csv')) {
    const header = 'id,name,country,lat,lng,fuelType,status,capacityMw,owner,commissionYear,source\n';
    const rows = PROJECTS.map(p =>
      [p.id, `"${p.name}"`, p.country, p.lat, p.lng, p.fuelType, p.status,
       p.capacityMw ?? '', `"${p.owner ?? ''}"`, p.commissionYear ?? '', p.source].join(',')
    ).join('\n');
    return new Response(header + rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="energymap_projects.csv"',
        'Cache-Control': 'no-store'
      }
    });
  }

  return json({ error: 'Not found' }, 404);
}

// ─── Service Worker lifecycle ──────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // Only intercept API routes (both relative and with port/5000 prefix)
  const isApiCall =
    url.includes('/api/') ||
    url.includes('port/5000/api') ||
    url.includes('port%2F5000');

  if (!isApiCall) return; // pass through everything else (live APIs, assets)

  // Handle POST /api/annotations by echoing the body back
  if (request.method === 'POST' && url.includes('/api/annotations')) {
    event.respondWith(
      request.json().then(body => {
        const NO_CACHE = {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        };
        return new Response(JSON.stringify({ ...body, createdAt: new Date().toISOString() }), {
          status: 201,
          headers: NO_CACHE
        });
      }).catch(() => new Response('{}', { status: 201 }))
    );
    return;
  }

  if (request.method === 'DELETE') {
    event.respondWith(new Response('{"ok":true}', {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    }));
    return;
  }

  event.respondWith(handleApi(url));
});
