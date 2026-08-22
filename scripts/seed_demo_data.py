
import os
import sys
from datetime import date, timedelta

BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, BACKEND_DIR)

from app.auth import hash_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Activity,
    ActivityCategory,
    BudgetCategory,
    BudgetRecord,
    Destination,
    ItineraryActivity,
    Trip,
    TripStatus,
    TripStop,
    TripVisibility,
    User,
    UserPreference,
    UserRole,
)

Base.metadata.create_all(bind=engine)

# City photography uses Lorem Picsum (https://picsum.photos) - a free, key-free
# placeholder photo service seeded deterministically per city so images stay
# stable across runs. Swap for a licensed travel-photo provider in production.
def photo(seed: str) -> str:
    return f"https://picsum.photos/seed/{seed}/900/600"


DESTINATIONS = [
    dict(city="Paris", country="France", country_code="FR", latitude=48.8566, longitude=2.3522,
         description="The City of Light, famed for the Eiffel Tower, world-class art, and café culture.",
         image_url=photo("paris-gt"), population=2148000, popularity_score=96, estimated_daily_cost=140, currency="EUR"),
    dict(city="London", country="United Kingdom", country_code="GB", latitude=51.5072, longitude=-0.1276,
         description="A historic global capital blending royal heritage with cutting-edge culture.",
         image_url=photo("london-gt"), population=8982000, popularity_score=94, estimated_daily_cost=150, currency="GBP"),
    dict(city="Dubai", country="United Arab Emirates", country_code="AE", latitude=25.2048, longitude=55.2708,
         description="A futuristic desert metropolis of record-breaking towers and luxury souks.",
         image_url=photo("dubai-gt"), population=3331000, popularity_score=90, estimated_daily_cost=160, currency="AED"),
    dict(city="Tokyo", country="Japan", country_code="JP", latitude=35.6762, longitude=139.6503,
         description="A dazzling mix of neon-lit skyscrapers, ancient temples, and world-class cuisine.",
         image_url=photo("tokyo-gt"), population=13960000, popularity_score=95, estimated_daily_cost=13000, currency="JPY"),
    dict(city="Mumbai", country="India", country_code="IN", latitude=19.0760, longitude=72.8777,
         description="Maharashtra's financial capital, home to Bollywood, colonial architecture, and street food.",
         image_url=photo("mumbai-gt"), population=12480000, popularity_score=82, estimated_daily_cost=3500, currency="INR"),
    dict(city="Delhi", country="India", country_code="IN", latitude=28.7041, longitude=77.1025,
         description="India's capital territory (NCT), layered with Mughal monuments, bustling bazaars, and modern city life.",
         image_url=photo("delhi-gt"), population=32900000, popularity_score=85, estimated_daily_cost=3200, currency="INR"),
    dict(city="Goa", country="India", country_code="IN", latitude=15.2993, longitude=74.1240,
         description="India's smallest state and beach paradise, known for golden sands, Portuguese heritage, and laid-back nightlife.",
         image_url=photo("goa-gt"), population=1458000, popularity_score=88, estimated_daily_cost=3000, currency="INR"),
    dict(city="Jaipur", country="India", country_code="IN", latitude=26.9124, longitude=75.7873,
         description="The Pink City and capital of Rajasthan, celebrated for majestic forts, palaces, and vibrant markets.",
         image_url=photo("jaipur-gt"), population=3070000, popularity_score=83, estimated_daily_cost=2800, currency="INR"),
    dict(city="Singapore", country="Singapore", country_code="SG", latitude=1.3521, longitude=103.8198,
         description="A gleaming garden city-state famed for hawker food, futuristic gardens, and skyline views.",
         image_url=photo("singapore-gt"), population=5686000, popularity_score=91, estimated_daily_cost=125, currency="SGD"),
    dict(city="New York", country="United States", country_code="US", latitude=40.7128, longitude=-74.0060,
         description="The city that never sleeps - iconic skyline, Broadway lights, and endless neighborhoods to explore.",
         image_url=photo("newyork-gt"), population=8336000, popularity_score=97, estimated_daily_cost=180, currency="USD"),

    # --- Europe ---
    dict(city="Rome", country="Italy", country_code="IT", latitude=41.9028, longitude=12.4964,
         description="The Eternal City, where ancient ruins, Renaissance art, and world-famous pasta share every street.",
         image_url=photo("rome-gt"), population=2873000, popularity_score=97, estimated_daily_cost=130, currency="EUR"),
    dict(city="Barcelona", country="Spain", country_code="ES", latitude=41.3851, longitude=2.1734,
         description="Gaudí's playful architecture, Mediterranean beaches, and tapas bars line this Catalan capital.",
         image_url=photo("barcelona-gt"), population=1620000, popularity_score=93, estimated_daily_cost=120, currency="EUR"),
    dict(city="Amsterdam", country="Netherlands", country_code="NL", latitude=52.3676, longitude=4.9041,
         description="Canal-ringed and bike-friendly, with world-class museums and a famously laid-back vibe.",
         image_url=photo("amsterdam-gt"), population=905000, popularity_score=90, estimated_daily_cost=140, currency="EUR"),
    dict(city="Berlin", country="Germany", country_code="DE", latitude=52.5200, longitude=13.4050,
         description="A city defined by its history, reinvented as a hub of art, nightlife, and modern culture.",
         image_url=photo("berlin-gt"), population=3677000, popularity_score=88, estimated_daily_cost=110, currency="EUR"),
    dict(city="Prague", country="Czech Republic", country_code="CZ", latitude=50.0755, longitude=14.4378,
         description="Fairy-tale spires, a medieval Old Town, and some of Europe's best-loved beer halls.",
         image_url=photo("prague-gt"), population=1309000, popularity_score=87, estimated_daily_cost=2200, currency="CZK"),
    dict(city="Vienna", country="Austria", country_code="AT", latitude=48.2082, longitude=16.3738,
         description="Imperial palaces, coffeehouse culture, and a legacy of classical music in every concert hall.",
         image_url=photo("vienna-gt"), population=1982000, popularity_score=85, estimated_daily_cost=130, currency="EUR"),
    dict(city="Istanbul", country="Turkey", country_code="TR", latitude=41.0082, longitude=28.9784,
         description="Where Europe meets Asia across the Bosphorus, layered with Byzantine and Ottoman history.",
         image_url=photo("istanbul-gt"), population=15460000, popularity_score=91, estimated_daily_cost=2500, currency="TRY"),
    dict(city="Athens", country="Greece", country_code="GR", latitude=37.9838, longitude=23.7275,
         description="The cradle of Western civilization, crowned by the Acropolis and the Parthenon.",
         image_url=photo("athens-gt"), population=3153000, popularity_score=86, estimated_daily_cost=100, currency="EUR"),
    dict(city="Venice", country="Italy", country_code="IT", latitude=45.4408, longitude=12.3155,
         description="A city of canals and gondolas, where every alley opens onto another postcard view.",
         image_url=photo("venice-gt"), population=258000, popularity_score=92, estimated_daily_cost=160, currency="EUR"),
    dict(city="Florence", country="Italy", country_code="IT", latitude=43.7696, longitude=11.2558,
         description="The birthplace of the Renaissance, dense with masterpieces and Tuscan trattorias.",
         image_url=photo("florence-gt"), population=366000, popularity_score=89, estimated_daily_cost=130, currency="EUR"),
    dict(city="Santorini", country="Greece", country_code="GR", latitude=36.3932, longitude=25.4615,
         description="Whitewashed clifftop villages overlooking a volcanic caldera and famously fiery sunsets.",
         image_url=photo("santorini-gt"), population=15500, popularity_score=90, estimated_daily_cost=180, currency="EUR"),
    dict(city="Reykjavik", country="Iceland", country_code="IS", latitude=64.1466, longitude=-21.9426,
         description="Gateway to Iceland's glaciers, geysers, and the northern lights, with a cozy capital at its heart.",
         image_url=photo("reykjavik-gt"), population=135000, popularity_score=78, estimated_daily_cost=25000, currency="ISK"),

    # --- Asia ---
    dict(city="Bangkok", country="Thailand", country_code="TH", latitude=13.7563, longitude=100.5018,
         description="Golden temples, floating markets, and legendary street food fuel this fast-paced capital.",
         image_url=photo("bangkok-gt"), population=10539000, popularity_score=92, estimated_daily_cost=2800, currency="THB"),
    dict(city="Kyoto", country="Japan", country_code="JP", latitude=35.0116, longitude=135.7681,
         description="Japan's former imperial capital, home to thousands of temples, shrines, and geisha districts.",
         image_url=photo("kyoto-gt"), population=1463000, popularity_score=88, estimated_daily_cost=15000, currency="JPY"),
    dict(city="Seoul", country="South Korea", country_code="KR", latitude=37.5665, longitude=126.9780,
         description="Ancient palaces sit beside K-pop billboards in this endlessly energetic megacity.",
         image_url=photo("seoul-gt"), population=9776000, popularity_score=89, estimated_daily_cost=130000, currency="KRW"),
    dict(city="Hong Kong", country="Hong Kong", country_code="HK", latitude=22.3193, longitude=114.1694,
         description="A dense skyline framed by mountains and harbor, with dim sum on every corner.",
         image_url=photo("hongkong-gt"), population=7491000, popularity_score=88, estimated_daily_cost=950, currency="HKD"),
    dict(city="Shanghai", country="China", country_code="CN", latitude=31.2304, longitude=121.4737,
         description="Futuristic skyscrapers rise over a colonial-era waterfront along the Bund.",
         image_url=photo("shanghai-gt"), population=24870000, popularity_score=84, estimated_daily_cost=650, currency="CNY"),
    dict(city="Beijing", country="China", country_code="CN", latitude=39.9042, longitude=116.4074,
         description="Home to the Forbidden City, Tiananmen Square, and the nearest stretch of the Great Wall.",
         image_url=photo("beijing-gt"), population=21540000, popularity_score=85, estimated_daily_cost=600, currency="CNY"),
    dict(city="Kuala Lumpur", country="Malaysia", country_code="MY", latitude=3.1390, longitude=101.6869,
         description="Twin skyscraper icons rise above a multicultural mix of Malay, Chinese, and Indian heritage.",
         image_url=photo("kualalumpur-gt"), population=1982000, popularity_score=78, estimated_daily_cost=350, currency="MYR"),
    dict(city="Hanoi", country="Vietnam", country_code="VN", latitude=21.0278, longitude=105.8342,
         description="A chaotic, charming Old Quarter of street food stalls, lakes, and French colonial architecture.",
         image_url=photo("hanoi-gt"), population=8246000, popularity_score=80, estimated_daily_cost=1500000, currency="VND"),
    dict(city="Ubud", country="Indonesia", country_code="ID", latitude=-8.5069, longitude=115.2625,
         description="Bali's cultural heart, wrapped in rice terraces, yoga retreats, and jungle temples.",
         image_url=photo("ubud-gt"), population=74000, popularity_score=85, estimated_daily_cost=900000, currency="IDR"),
    dict(city="Kathmandu", country="Nepal", country_code="NP", latitude=27.7172, longitude=85.3240,
         description="Gateway to the Himalayas, packed with ancient stupas and Durbar Square temples.",
         image_url=photo("kathmandu-gt"), population=1003000, popularity_score=72, estimated_daily_cost=5000, currency="NPR"),
    dict(city="Colombo", country="Sri Lanka", country_code="LK", latitude=6.9271, longitude=79.8612,
         description="A coastal capital blending colonial buildings, Buddhist temples, and Ceylon tea culture.",
         image_url=photo("colombo-gt"), population=752000, popularity_score=68, estimated_daily_cost=15000, currency="LKR"),
    dict(city="Malé", country="Maldives", country_code="MV", latitude=4.1755, longitude=73.5093,
         description="The world's smallest capital, and the gateway to turquoise atolls and overwater bungalows.",
         image_url=photo("male-gt"), population=133000, popularity_score=82, estimated_daily_cost=4500, currency="MVR"),

    # --- Middle East ---
    dict(city="Abu Dhabi", country="United Arab Emirates", country_code="AE", latitude=24.4539, longitude=54.3773,
         description="The UAE's capital, home to a grand mosque, cultural museums, and Formula 1 nightlife.",
         image_url=photo("abudhabi-gt"), population=1483000, popularity_score=80, estimated_daily_cost=550, currency="AED"),
    dict(city="Doha", country="Qatar", country_code="QA", latitude=25.2854, longitude=51.5310,
         description="A skyline of ultramodern towers beside a restored traditional souq on the Corniche.",
         image_url=photo("doha-gt"), population=1450000, popularity_score=74, estimated_daily_cost=500, currency="QAR"),
    dict(city="Muscat", country="Oman", country_code="OM", latitude=23.5859, longitude=58.4059,
         description="Whitewashed low-rise buildings, dramatic mountains, and one of the region's grandest mosques.",
         image_url=photo("muscat-gt"), population=1560000, popularity_score=68, estimated_daily_cost=55, currency="OMR"),
    dict(city="Amman", country="Jordan", country_code="JO", latitude=31.9454, longitude=35.9284,
         description="A modern capital built across seven hills, and the launchpad for trips to Petra.",
         image_url=photo("amman-gt"), population=4007000, popularity_score=70, estimated_daily_cost=70, currency="JOD"),

    # --- Africa ---
    dict(city="Cape Town", country="South Africa", country_code="ZA", latitude=-33.9249, longitude=18.4241,
         description="Table Mountain towers over vineyards, beaches, and the meeting point of two oceans.",
         image_url=photo("capetown-gt"), population=4618000, popularity_score=88, estimated_daily_cost=1400, currency="ZAR"),
    dict(city="Marrakech", country="Morocco", country_code="MA", latitude=31.6295, longitude=-7.9811,
         description="A maze of souks, riads, and gardens behind the red walls of Morocco's Red City.",
         image_url=photo("marrakech-gt"), population=928000, popularity_score=84, estimated_daily_cost=600, currency="MAD"),
    dict(city="Cairo", country="Egypt", country_code="EG", latitude=30.0444, longitude=31.2357,
         description="The Pyramids of Giza rise at the edge of a sprawling city thousands of years in the making.",
         image_url=photo("cairo-gt"), population=9850000, popularity_score=86, estimated_daily_cost=2500, currency="EGP"),
    dict(city="Zanzibar City", country="Tanzania", country_code="TZ", latitude=-6.1659, longitude=39.2026,
         description="Spice-scented Stone Town gives way to white-sand beaches along the Indian Ocean.",
         image_url=photo("zanzibar-gt"), population=720000, popularity_score=79, estimated_daily_cost=130000, currency="TZS"),
    dict(city="Nairobi", country="Kenya", country_code="KE", latitude=-1.2921, longitude=36.8219,
         description="A safari gateway city with a national park - and its resident giraffes - right at its edge.",
         image_url=photo("nairobi-gt"), population=4397000, popularity_score=70, estimated_daily_cost=9000, currency="KES"),

    # --- Americas ---
    dict(city="Rio de Janeiro", country="Brazil", country_code="BR", latitude=-22.9068, longitude=-43.1729,
         description="Christ the Redeemer watches over beaches, samba, and dramatic granite peaks.",
         image_url=photo("rio-gt"), population=6748000, popularity_score=89, estimated_daily_cost=450, currency="BRL"),
    dict(city="Buenos Aires", country="Argentina", country_code="AR", latitude=-34.6037, longitude=-58.3816,
         description="The Paris of South America, built for tango, steak dinners, and late-night café culture.",
         image_url=photo("buenosaires-gt"), population=3076000, popularity_score=85, estimated_daily_cost=90000, currency="ARS"),
    dict(city="Cusco", country="Peru", country_code="PE", latitude=-13.5319, longitude=-71.9675,
         description="A former Inca capital high in the Andes, and the launch point for Machu Picchu.",
         image_url=photo("cusco-gt"), population=428000, popularity_score=83, estimated_daily_cost=280, currency="PEN"),
    dict(city="Mexico City", country="Mexico", country_code="MX", latitude=19.4326, longitude=-99.1332,
         description="A vast, altitude-defying capital of world-class museums, street tacos, and Aztec ruins.",
         image_url=photo("mexicocity-gt"), population=9209000, popularity_score=84, estimated_daily_cost=1400, currency="MXN"),
    dict(city="Toronto", country="Canada", country_code="CA", latitude=43.6532, longitude=-79.3832,
         description="Canada's largest city, famed for its CN Tower skyline and easy access to Niagara Falls.",
         image_url=photo("toronto-gt"), population=2930000, popularity_score=82, estimated_daily_cost=180, currency="CAD"),
    dict(city="San Francisco", country="United States", country_code="US", latitude=37.7749, longitude=-122.4194,
         description="Fog-wrapped hills, the Golden Gate Bridge, and cable cars over some of the steepest streets around.",
         image_url=photo("sanfrancisco-gt"), population=873000, popularity_score=87, estimated_daily_cost=220, currency="USD"),
    dict(city="Los Angeles", country="United States", country_code="US", latitude=34.0522, longitude=-118.2437,
         description="Hollywood glamour, beach boardwalks, and endless sunshine spread across a sprawling metropolis.",
         image_url=photo("losangeles-gt"), population=3898000, popularity_score=86, estimated_daily_cost=190, currency="USD"),
    dict(city="Miami", country="United States", country_code="US", latitude=25.7617, longitude=-80.1918,
         description="Art Deco pastels, Latin American flavor, and beach clubs along a neon-lit coastline.",
         image_url=photo("miami-gt"), population=442000, popularity_score=83, estimated_daily_cost=180, currency="USD"),
    dict(city="Vancouver", country="Canada", country_code="CA", latitude=49.2827, longitude=-123.1207,
         description="Mountains and ocean frame a walkable city with a thriving food and outdoor-adventure scene.",
         image_url=photo("vancouver-gt"), population=662000, popularity_score=81, estimated_daily_cost=170, currency="CAD"),
    dict(city="Havana", country="Cuba", country_code="CU", latitude=23.1136, longitude=-82.3666,
         description="Classic cars and pastel colonial facades line streets alive with live salsa music.",
         image_url=photo("havana-gt"), population=2131000, popularity_score=79, estimated_daily_cost=90, currency="USD"),

    # --- Oceania ---
    dict(city="Sydney", country="Australia", country_code="AU", latitude=-33.8688, longitude=151.2093,
         description="The Opera House and Harbour Bridge frame a city built around beaches and coastal walks.",
         image_url=photo("sydney-gt"), population=5312000, popularity_score=92, estimated_daily_cost=230, currency="AUD"),
    dict(city="Melbourne", country="Australia", country_code="AU", latitude=-37.8136, longitude=144.9631,
         description="Laneway cafés, street art, and a self-proclaimed capital of Australian coffee culture.",
         image_url=photo("melbourne-gt"), population=5078000, popularity_score=87, estimated_daily_cost=210, currency="AUD"),
    dict(city="Auckland", country="New Zealand", country_code="NZ", latitude=-36.8485, longitude=174.7633,
         description="A city of volcanoes and harbors, and the gateway to New Zealand's wine regions and islands.",
         image_url=photo("auckland-gt"), population=1657000, popularity_score=79, estimated_daily_cost=230, currency="NZD"),
    dict(city="Queenstown", country="New Zealand", country_code="NZ", latitude=-45.0312, longitude=168.6626,
         description="New Zealand's adventure capital, ringed by the Southern Alps and Lake Wakatipu.",
         image_url=photo("queenstown-gt"), population=15800, popularity_score=81, estimated_daily_cost=260, currency="NZD"),

    # --- India (expanded, spanning many different states) ---
    dict(city="Agra", country="India", country_code="IN", latitude=27.1767, longitude=78.0081,
         description="Uttar Pradesh's Mughal-era icon, home to the Taj Mahal, one of the world's most enduring monuments to love.",
         image_url=photo("agra-gt"), population=1585000, popularity_score=91, estimated_daily_cost=2200, currency="INR"),
    dict(city="Varanasi", country="India", country_code="IN", latitude=25.3176, longitude=82.9739,
         description="One of the world's oldest living cities, in Uttar Pradesh, where sunrise boat rides drift past sacred Ganges ghats.",
         image_url=photo("varanasi-gt"), population=1435000, popularity_score=80, estimated_daily_cost=2000, currency="INR"),
    dict(city="Udaipur", country="India", country_code="IN", latitude=24.5854, longitude=73.7125,
         description="Rajasthan's City of Lakes, ringed by palaces that seem to float on Lake Pichola.",
         image_url=photo("udaipur-gt"), population=475000, popularity_score=82, estimated_daily_cost=3200, currency="INR"),
    dict(city="Kochi", country="India", country_code="IN", latitude=9.9312, longitude=76.2673,
         description="Chinese fishing nets and colonial spice warehouses meet Kerala's backwaters.",
         image_url=photo("kochi-gt"), population=677000, popularity_score=74, estimated_daily_cost=2800, currency="INR"),
    dict(city="Amritsar", country="India", country_code="IN", latitude=31.6340, longitude=74.8723,
         description="Punjab's spiritual heart, home to the golden, shimmering Harmandir Sahib (Golden Temple).",
         image_url=photo("amritsar-gt"), population=1183000, popularity_score=76, estimated_daily_cost=2000, currency="INR"),
    dict(city="Bengaluru", country="India", country_code="IN", latitude=12.9716, longitude=77.5946,
         description="Karnataka's tech capital, blending Silicon Valley-style energy with garden-city greenery and craft breweries.",
         image_url=photo("bengaluru-gt"), population=8443000, popularity_score=78, estimated_daily_cost=2800, currency="INR"),
    dict(city="Chennai", country="India", country_code="IN", latitude=13.0827, longitude=80.2707,
         description="Tamil Nadu's coastal capital, with Marina Beach, Dravidian temples, and a deep classical arts tradition.",
         image_url=photo("chennai-gt"), population=7090000, popularity_score=74, estimated_daily_cost=2500, currency="INR"),
    dict(city="Kolkata", country="India", country_code="IN", latitude=22.5726, longitude=88.3639,
         description="West Bengal's cultural capital, layered with colonial architecture, literary cafés, and festival fervor.",
         image_url=photo("kolkata-gt"), population=4631000, popularity_score=79, estimated_daily_cost=2200, currency="INR"),
    dict(city="Shimla", country="India", country_code="IN", latitude=31.1048, longitude=77.1734,
         description="Himachal Pradesh's former British hill-station capital, wrapped in pine forests and mountain views.",
         image_url=photo("shimla-gt"), population=171000, popularity_score=77, estimated_daily_cost=2600, currency="INR"),
    dict(city="Rishikesh", country="India", country_code="IN", latitude=30.0869, longitude=78.2676,
         description="Uttarakhand's Yoga Capital of the World, where the Ganges rushes down from the Himalayan foothills.",
         image_url=photo("rishikesh-gt"), population=102000, popularity_score=81, estimated_daily_cost=2200, currency="INR"),
    dict(city="Ahmedabad", country="India", country_code="IN", latitude=23.0225, longitude=72.5714,
         description="Gujarat's UNESCO-listed heritage capital, known for stepwells, textiles, and Gandhi's ashram.",
         image_url=photo("ahmedabad-gt"), population=5570000, popularity_score=70, estimated_daily_cost=2400, currency="INR"),
]

ACTIVITIES = {
    "Paris": [
        ("Eiffel Tower Summit Access", ActivityCategory.attraction, 28.0, 120, 4.8, "09:00", "23:00"),
        ("Louvre Museum Guided Tour", ActivityCategory.museum, 22.0, 180, 4.9, "09:00", "18:00"),
        ("Seine River Dinner Cruise", ActivityCategory.food, 65.0, 120, 4.6, "19:00", "22:00"),
        ("Montmartre & Sacré-Cœur Walk", ActivityCategory.culture, 0.0, 150, 4.7, "08:00", "20:00"),
        ("Le Marais Food Tasting Tour", ActivityCategory.food, 45.0, 150, 4.7, "11:00", "15:00"),
        ("Versailles Palace Day Trip", ActivityCategory.attraction, 35.0, 300, 4.8, "08:00", "18:00"),
    ],
    "London": [
        ("Tower of London & Crown Jewels", ActivityCategory.attraction, 33.0, 150, 4.7, "09:00", "17:30"),
        ("British Museum Highlights Tour", ActivityCategory.museum, 0.0, 120, 4.8, "10:00", "17:00"),
        ("West End Musical Night", ActivityCategory.entertainment, 85.0, 150, 4.8, "19:30", "22:00"),
        ("Borough Market Food Crawl", ActivityCategory.food, 30.0, 120, 4.6, "11:00", "15:00"),
        ("Thames Sunset River Cruise", ActivityCategory.attraction, 25.0, 90, 4.5, "18:00", "20:00"),
        ("Camden Town Nightlife Walk", ActivityCategory.nightlife, 15.0, 180, 4.3, "20:00", "23:59"),
    ],
    "Dubai": [
        ("Burj Khalifa Observation Deck", ActivityCategory.attraction, 40.0, 90, 4.7, "09:00", "23:00"),
        ("Desert Safari & BBQ Dinner", ActivityCategory.adventure, 70.0, 300, 4.8, "15:00", "21:00"),
        ("Dubai Mall & Fountain Show", ActivityCategory.shopping, 0.0, 150, 4.6, "10:00", "23:00"),
        ("Gold & Spice Souk Tour", ActivityCategory.culture, 20.0, 120, 4.5, "10:00", "18:00"),
        ("Burj Al Arab Afternoon Tea", ActivityCategory.food, 120.0, 90, 4.7, "14:00", "17:00"),
        ("Skydive Palm Jumeirah", ActivityCategory.adventure, 400.0, 60, 4.9, "07:00", "12:00"),
    ],
    "Tokyo": [
        ("Senso-ji Temple & Asakusa", ActivityCategory.religious, 0.0, 120, 4.7, "06:00", "20:00"),
        ("Tsukiji Outer Market Food Tour", ActivityCategory.food, 5000.0, 150, 4.8, "07:00", "12:00"),
        ("Shibuya & Harajuku Street Walk", ActivityCategory.culture, 0.0, 150, 4.6, "10:00", "21:00"),
        ("teamLab Digital Art Museum", ActivityCategory.entertainment, 3200.0, 120, 4.8, "10:00", "19:00"),
        ("Mount Fuji Day Trip", ActivityCategory.nature, 10000.0, 480, 4.7, "07:00", "19:00"),
        ("Robot Restaurant Show", ActivityCategory.nightlife, 8000.0, 90, 4.2, "19:00", "23:00"),
    ],
    "Mumbai": [
        ("Gateway of India & Colaba Walk", ActivityCategory.attraction, 0.0, 120, 4.5, "07:00", "20:00"),
        ("Elephanta Caves Ferry Tour", ActivityCategory.culture, 1200.0, 240, 4.4, "09:00", "16:00"),
        ("Mumbai Street Food Trail", ActivityCategory.food, 800.0, 150, 4.7, "17:00", "21:00"),
        ("Marine Drive Sunset Walk", ActivityCategory.nature, 0.0, 90, 4.6, "17:00", "20:00"),
        ("Bollywood Studio Tour", ActivityCategory.entertainment, 1500.0, 180, 4.3, "10:00", "16:00"),
    ],
    "Delhi": [
        ("Red Fort & Chandni Chowk", ActivityCategory.attraction, 600.0, 180, 4.6, "09:00", "18:00"),
        ("India Gate Evening Visit", ActivityCategory.attraction, 0.0, 60, 4.5, "16:00", "21:00"),
        ("Humayun's Tomb Heritage Tour", ActivityCategory.culture, 600.0, 120, 4.6, "08:00", "18:00"),
        ("Old Delhi Food Walk", ActivityCategory.food, 1000.0, 150, 4.8, "17:00", "21:00"),
        ("Qutub Minar Complex", ActivityCategory.museum, 600.0, 90, 4.5, "07:00", "17:00"),
    ],
    "Goa": [
        ("Baga Beach Water Sports", ActivityCategory.adventure, 2000.0, 150, 4.5, "09:00", "17:00"),
        ("Old Goa Churches Tour", ActivityCategory.religious, 0.0, 120, 4.4, "09:00", "17:00"),
        ("Anjuna Flea Market", ActivityCategory.shopping, 0.0, 120, 4.3, "10:00", "18:00"),
        ("Sunset Cruise on Mandovi River", ActivityCategory.nature, 600.0, 90, 4.5, "17:30", "19:30"),
        ("Beach Shack Seafood Dinner", ActivityCategory.food, 1200.0, 90, 4.6, "19:00", "22:00"),
        ("Tito's Lane Nightlife", ActivityCategory.nightlife, 500.0, 180, 4.2, "21:00", "23:59"),
    ],
    "Jaipur": [
        ("Amber Fort Elephant Gate Tour", ActivityCategory.attraction, 1000.0, 150, 4.8, "08:00", "17:00"),
        ("Hawa Mahal Photo Stop", ActivityCategory.attraction, 200.0, 45, 4.6, "09:00", "16:00"),
        ("City Palace Heritage Walk", ActivityCategory.culture, 700.0, 120, 4.6, "09:00", "17:00"),
        ("Johari Bazaar Shopping", ActivityCategory.shopping, 0.0, 120, 4.4, "10:00", "20:00"),
        ("Rajasthani Thali Dinner", ActivityCategory.food, 700.0, 90, 4.7, "19:00", "21:30"),
    ],
    "Singapore": [
        ("Gardens by the Bay & Cloud Forest", ActivityCategory.nature, 28.0, 150, 4.8, "09:00", "21:00"),
        ("Marina Bay Sands SkyPark", ActivityCategory.attraction, 26.0, 90, 4.7, "09:30", "22:00"),
        ("Hawker Centre Food Trail", ActivityCategory.food, 15.0, 120, 4.8, "11:00", "14:00"),
        ("Sentosa Island Beach Day", ActivityCategory.entertainment, 20.0, 240, 4.5, "10:00", "19:00"),
        ("Chinatown & Little India Walk", ActivityCategory.culture, 0.0, 150, 4.5, "10:00", "18:00"),
    ],
    "New York": [
        ("Statue of Liberty & Ellis Island", ActivityCategory.attraction, 24.0, 210, 4.7, "08:30", "16:00"),
        ("Top of the Rock Observation Deck", ActivityCategory.attraction, 40.0, 60, 4.7, "08:00", "23:00"),
        ("Broadway Show Night", ActivityCategory.entertainment, 130.0, 150, 4.8, "19:30", "22:30"),
        ("Central Park Bike Tour", ActivityCategory.nature, 35.0, 120, 4.6, "09:00", "18:00"),
        ("MoMA Modern Art Tour", ActivityCategory.museum, 25.0, 120, 4.6, "10:00", "17:00"),
        ("Brooklyn Pizza & Food Crawl", ActivityCategory.food, 55.0, 180, 4.7, "17:00", "21:00"),
    ],

    # --- Europe ---
    "Rome": [
        ("Colosseum & Roman Forum Tour", ActivityCategory.attraction, 32.0, 150, 4.8, "09:00", "18:00"),
        ("Vatican Museums & Sistine Chapel", ActivityCategory.museum, 28.0, 180, 4.9, "08:00", "18:00"),
        ("Trevi Fountain Evening Walk", ActivityCategory.attraction, 0.0, 90, 4.6, "18:00", "23:00"),
        ("Trastevere Food & Wine Tour", ActivityCategory.food, 60.0, 180, 4.8, "18:00", "22:00"),
        ("Pantheon & Piazza Navona Walk", ActivityCategory.culture, 0.0, 120, 4.6, "09:00", "20:00"),
    ],
    "Barcelona": [
        ("Sagrada Família Guided Tour", ActivityCategory.attraction, 33.0, 90, 4.9, "09:00", "19:00"),
        ("Park Güell Visit", ActivityCategory.nature, 18.0, 120, 4.6, "09:00", "18:00"),
        ("Gothic Quarter Walking Tour", ActivityCategory.culture, 0.0, 120, 4.6, "10:00", "19:00"),
        ("La Boqueria Market Food Tour", ActivityCategory.food, 45.0, 150, 4.7, "10:00", "14:00"),
        ("Flamenco Show in Poble Sec", ActivityCategory.entertainment, 40.0, 90, 4.5, "20:00", "22:00"),
    ],
    "Amsterdam": [
        ("Anne Frank House Tour", ActivityCategory.museum, 16.0, 90, 4.8, "09:00", "18:00"),
        ("Van Gogh Museum Visit", ActivityCategory.museum, 22.0, 120, 4.8, "09:00", "18:00"),
        ("Amsterdam Canal Cruise", ActivityCategory.attraction, 20.0, 75, 4.6, "10:00", "21:00"),
        ("Vondelpark Bike Ride", ActivityCategory.nature, 12.0, 120, 4.5, "09:00", "19:00"),
        ("Jordaan District Food Walk", ActivityCategory.food, 50.0, 150, 4.7, "17:00", "21:00"),
    ],
    "Berlin": [
        ("Brandenburg Gate & Reichstag Tour", ActivityCategory.attraction, 0.0, 120, 4.6, "09:00", "18:00"),
        ("Berlin Wall Memorial & East Side Gallery", ActivityCategory.culture, 0.0, 90, 4.7, "08:00", "20:00"),
        ("Museum Island Pass", ActivityCategory.museum, 19.0, 180, 4.7, "10:00", "18:00"),
        ("Currywurst Street Food Tour", ActivityCategory.food, 35.0, 120, 4.5, "12:00", "16:00"),
        ("Berlin Nightlife District Walk", ActivityCategory.nightlife, 15.0, 180, 4.3, "21:00", "23:59"),
    ],
    "Prague": [
        ("Prague Castle Tour", ActivityCategory.attraction, 400.0, 150, 4.7, "09:00", "17:00"),
        ("Charles Bridge & Old Town Walk", ActivityCategory.culture, 0.0, 90, 4.7, "08:00", "21:00"),
        ("Astronomical Clock & Old Town Square", ActivityCategory.attraction, 0.0, 60, 4.5, "09:00", "20:00"),
        ("Czech Beer Hall Experience", ActivityCategory.food, 600.0, 120, 4.6, "18:00", "22:00"),
        ("Vltava River Cruise", ActivityCategory.nature, 350.0, 90, 4.5, "13:00", "20:00"),
    ],
    "Vienna": [
        ("Schönbrunn Palace Tour", ActivityCategory.attraction, 26.0, 120, 4.7, "09:00", "17:00"),
        ("Vienna State Opera Show", ActivityCategory.entertainment, 90.0, 180, 4.8, "19:00", "22:00"),
        ("Belvedere Museum (Klimt's The Kiss)", ActivityCategory.museum, 17.0, 90, 4.7, "09:00", "18:00"),
        ("Naschmarkt Food Tour", ActivityCategory.food, 40.0, 120, 4.6, "10:00", "15:00"),
        ("Ringstrasse Tram Sightseeing", ActivityCategory.attraction, 10.0, 60, 4.3, "09:00", "19:00"),
    ],
    "Istanbul": [
        ("Hagia Sophia & Blue Mosque Tour", ActivityCategory.religious, 0.0, 150, 4.8, "09:00", "18:00"),
        ("Grand Bazaar Shopping", ActivityCategory.shopping, 0.0, 150, 4.6, "09:00", "19:00"),
        ("Bosphorus Sunset Cruise", ActivityCategory.nature, 600.0, 90, 4.7, "17:30", "19:30"),
        ("Topkapi Palace Visit", ActivityCategory.attraction, 650.0, 120, 4.7, "09:00", "17:00"),
        ("Turkish Bath (Hamam) Experience", ActivityCategory.entertainment, 900.0, 90, 4.5, "10:00", "21:00"),
    ],
    "Athens": [
        ("Acropolis & Parthenon Tour", ActivityCategory.attraction, 20.0, 150, 4.9, "08:00", "18:00"),
        ("Ancient Agora Walk", ActivityCategory.culture, 10.0, 90, 4.5, "08:00", "18:00"),
        ("Plaka District Food Tour", ActivityCategory.food, 45.0, 150, 4.7, "18:00", "21:00"),
        ("National Archaeological Museum", ActivityCategory.museum, 12.0, 120, 4.6, "09:00", "17:00"),
        ("Lycabettus Hill Sunset Walk", ActivityCategory.nature, 0.0, 90, 4.6, "17:00", "20:00"),
    ],
    "Venice": [
        ("Grand Canal Gondola Ride", ActivityCategory.attraction, 80.0, 30, 4.7, "09:00", "20:00"),
        ("St. Mark's Basilica & Square", ActivityCategory.religious, 3.0, 90, 4.7, "09:30", "17:00"),
        ("Doge's Palace Tour", ActivityCategory.museum, 25.0, 120, 4.6, "09:00", "18:00"),
        ("Murano Glass Island Trip", ActivityCategory.culture, 20.0, 180, 4.5, "10:00", "17:00"),
        ("Venetian Cicchetti Food Tour", ActivityCategory.food, 55.0, 150, 4.7, "17:00", "21:00"),
    ],
    "Florence": [
        ("Uffizi Gallery Tour", ActivityCategory.museum, 25.0, 150, 4.8, "09:00", "18:00"),
        ("Duomo & Bell Tower Climb", ActivityCategory.attraction, 20.0, 90, 4.7, "08:30", "19:00"),
        ("Ponte Vecchio Walk", ActivityCategory.culture, 0.0, 45, 4.5, "08:00", "21:00"),
        ("Tuscan Cooking Class", ActivityCategory.food, 75.0, 180, 4.8, "16:00", "20:00"),
        ("Boboli Gardens Visit", ActivityCategory.nature, 10.0, 90, 4.5, "09:00", "17:00"),
    ],
    "Santorini": [
        ("Oia Sunset Viewpoint", ActivityCategory.nature, 0.0, 90, 4.9, "18:00", "20:30"),
        ("Santorini Volcano Boat Tour", ActivityCategory.adventure, 35.0, 240, 4.6, "09:00", "14:00"),
        ("Red Beach Visit", ActivityCategory.nature, 0.0, 120, 4.4, "09:00", "18:00"),
        ("Santorini Wine Tasting Tour", ActivityCategory.food, 60.0, 150, 4.7, "15:00", "18:00"),
        ("Fira to Oia Caldera Hike", ActivityCategory.adventure, 0.0, 180, 4.6, "08:00", "12:00"),
    ],
    "Reykjavik": [
        ("Golden Circle Day Tour", ActivityCategory.nature, 15000.0, 480, 4.8, "08:00", "18:00"),
        ("Blue Lagoon Geothermal Spa", ActivityCategory.entertainment, 12000.0, 180, 4.7, "08:00", "22:00"),
        ("Northern Lights Night Tour", ActivityCategory.adventure, 11000.0, 210, 4.6, "20:00", "23:30"),
        ("Reykjavik Whale Watching", ActivityCategory.adventure, 13000.0, 180, 4.6, "09:00", "17:00"),
        ("Hallgrímskirkja Church Visit", ActivityCategory.religious, 1200.0, 45, 4.5, "09:00", "17:00"),
    ],

    # --- Asia ---
    "Bangkok": [
        ("Grand Palace & Wat Phra Kaew", ActivityCategory.religious, 500.0, 150, 4.7, "08:30", "15:30"),
        ("Wat Arun Temple Visit", ActivityCategory.religious, 100.0, 90, 4.6, "08:00", "18:00"),
        ("Chatuchak Weekend Market", ActivityCategory.shopping, 0.0, 180, 4.6, "09:00", "18:00"),
        ("Floating Market Boat Tour", ActivityCategory.culture, 800.0, 240, 4.5, "07:00", "12:00"),
        ("Thai Street Food Night Tour", ActivityCategory.food, 900.0, 180, 4.8, "18:00", "22:00"),
    ],
    "Kyoto": [
        ("Fushimi Inari Shrine Walk", ActivityCategory.religious, 0.0, 120, 4.8, "06:00", "20:00"),
        ("Kinkaku-ji (Golden Pavilion)", ActivityCategory.attraction, 500.0, 60, 4.8, "09:00", "17:00"),
        ("Arashiyama Bamboo Grove", ActivityCategory.nature, 0.0, 90, 4.7, "08:00", "18:00"),
        ("Gion District Geisha Walk", ActivityCategory.culture, 0.0, 120, 4.5, "16:00", "20:00"),
        ("Kyoto Tea Ceremony Experience", ActivityCategory.entertainment, 4500.0, 60, 4.7, "10:00", "17:00"),
    ],
    "Seoul": [
        ("Gyeongbokgung Palace Tour", ActivityCategory.attraction, 3000.0, 120, 4.7, "09:00", "18:00"),
        ("Bukchon Hanok Village Walk", ActivityCategory.culture, 0.0, 90, 4.6, "09:00", "18:00"),
        ("Myeongdong Street Food Tour", ActivityCategory.food, 30000.0, 150, 4.7, "17:00", "22:00"),
        ("N Seoul Tower Visit", ActivityCategory.attraction, 16000.0, 90, 4.6, "10:00", "23:00"),
        ("DMZ Day Trip", ActivityCategory.culture, 65000.0, 480, 4.5, "07:00", "17:00"),
    ],
    "Hong Kong": [
        ("Victoria Peak Tram & Views", ActivityCategory.attraction, 88.0, 90, 4.7, "10:00", "23:00"),
        ("Star Ferry Harbour Crossing", ActivityCategory.attraction, 5.0, 30, 4.5, "06:30", "23:30"),
        ("Temple Street Night Market", ActivityCategory.shopping, 0.0, 150, 4.5, "18:00", "23:00"),
        ("Big Buddha & Ngong Ping Village", ActivityCategory.religious, 0.0, 240, 4.6, "09:00", "18:00"),
        ("Dim Sum Food Tour", ActivityCategory.food, 450.0, 150, 4.8, "11:00", "14:00"),
    ],
    "Shanghai": [
        ("The Bund Waterfront Walk", ActivityCategory.attraction, 0.0, 90, 4.6, "08:00", "22:00"),
        ("Yu Garden & Old City", ActivityCategory.nature, 40.0, 120, 4.5, "08:30", "17:00"),
        ("Shanghai Tower Observation Deck", ActivityCategory.attraction, 180.0, 90, 4.7, "08:30", "22:00"),
        ("French Concession Food Tour", ActivityCategory.food, 350.0, 150, 4.6, "17:00", "21:00"),
        ("Zhujiajiao Water Town Trip", ActivityCategory.culture, 60.0, 240, 4.4, "08:00", "17:00"),
    ],
    "Beijing": [
        ("Great Wall of China Day Trip", ActivityCategory.adventure, 450.0, 480, 4.9, "07:00", "18:00"),
        ("Forbidden City Tour", ActivityCategory.attraction, 60.0, 180, 4.8, "08:30", "17:00"),
        ("Temple of Heaven Visit", ActivityCategory.religious, 30.0, 90, 4.5, "06:00", "21:00"),
        ("Hutong Alleyway Rickshaw Tour", ActivityCategory.culture, 150.0, 90, 4.5, "09:00", "17:00"),
        ("Peking Duck Dinner", ActivityCategory.food, 200.0, 90, 4.7, "18:00", "21:00"),
    ],
    "Kuala Lumpur": [
        ("Petronas Towers Skybridge", ActivityCategory.attraction, 98.0, 90, 4.7, "09:00", "21:00"),
        ("Batu Caves Visit", ActivityCategory.religious, 0.0, 120, 4.5, "07:00", "20:00"),
        ("KL Street Food Night Tour", ActivityCategory.food, 150.0, 180, 4.8, "18:00", "22:00"),
        ("Central Market Shopping", ActivityCategory.shopping, 0.0, 90, 4.3, "10:00", "22:00"),
        ("KL Tower Sky Deck", ActivityCategory.attraction, 105.0, 60, 4.5, "09:00", "22:00"),
    ],
    "Hanoi": [
        ("Old Quarter Walking Tour", ActivityCategory.culture, 0.0, 120, 4.6, "08:00", "20:00"),
        ("Hoan Kiem Lake Walk", ActivityCategory.nature, 0.0, 60, 4.5, "06:00", "21:00"),
        ("Water Puppet Show", ActivityCategory.entertainment, 200000.0, 60, 4.5, "18:00", "20:30"),
        ("Halong Bay Day Trip", ActivityCategory.adventure, 1200000.0, 600, 4.8, "07:00", "20:00"),
        ("Vietnamese Street Food Tour", ActivityCategory.food, 600000.0, 180, 4.8, "17:00", "21:00"),
    ],
    "Ubud": [
        ("Ubud Monkey Forest Sanctuary", ActivityCategory.nature, 80000.0, 90, 4.4, "08:30", "18:00"),
        ("Tegallalang Rice Terraces", ActivityCategory.nature, 20000.0, 120, 4.6, "07:00", "18:00"),
        ("Ubud Traditional Dance Show", ActivityCategory.entertainment, 100000.0, 90, 4.5, "19:00", "21:00"),
        ("Balinese Cooking Class", ActivityCategory.food, 350000.0, 180, 4.8, "10:00", "14:00"),
        ("Campuhan Ridge Sunrise Walk", ActivityCategory.adventure, 0.0, 90, 4.7, "06:00", "09:00"),
    ],
    "Kathmandu": [
        ("Swayambhunath Stupa Visit", ActivityCategory.religious, 200.0, 90, 4.6, "05:00", "19:00"),
        ("Durbar Square Heritage Walk", ActivityCategory.culture, 1000.0, 120, 4.5, "09:00", "18:00"),
        ("Boudhanath Stupa Visit", ActivityCategory.religious, 0.0, 60, 4.6, "05:00", "20:00"),
        ("Nepali Momo Food Tour", ActivityCategory.food, 1200.0, 150, 4.7, "17:00", "21:00"),
        ("Pashupatinath Temple Visit", ActivityCategory.religious, 1000.0, 90, 4.5, "04:00", "21:00"),
    ],
    "Colombo": [
        ("Galle Face Green Walk", ActivityCategory.nature, 0.0, 60, 4.4, "16:00", "20:00"),
        ("Gangaramaya Temple Visit", ActivityCategory.religious, 300.0, 60, 4.5, "06:00", "20:00"),
        ("National Museum of Colombo", ActivityCategory.museum, 500.0, 90, 4.3, "09:00", "17:00"),
        ("Pettah Market Shopping", ActivityCategory.shopping, 0.0, 120, 4.2, "09:00", "18:00"),
        ("Sri Lankan Tea Tasting Tour", ActivityCategory.food, 2000.0, 90, 4.6, "10:00", "16:00"),
    ],
    "Malé": [
        ("Local Island Snorkeling Trip", ActivityCategory.adventure, 900.0, 180, 4.7, "09:00", "13:00"),
        ("Malé Fish Market Visit", ActivityCategory.culture, 0.0, 60, 4.3, "07:00", "18:00"),
        ("Sunset Dolphin Cruise", ActivityCategory.nature, 1200.0, 120, 4.7, "16:30", "18:30"),
        ("Grand Friday Mosque Visit", ActivityCategory.religious, 0.0, 45, 4.4, "09:00", "17:00"),
        ("Overwater Bungalow Spa Day", ActivityCategory.entertainment, 3500.0, 180, 4.8, "10:00", "18:00"),
    ],

    # --- Middle East ---
    "Abu Dhabi": [
        ("Sheikh Zayed Grand Mosque Tour", ActivityCategory.religious, 0.0, 90, 4.9, "09:00", "22:00"),
        ("Louvre Abu Dhabi Visit", ActivityCategory.museum, 63.0, 150, 4.7, "10:00", "18:30"),
        ("Yas Island Theme Parks", ActivityCategory.entertainment, 295.0, 360, 4.6, "10:00", "20:00"),
        ("Corniche Beach Walk", ActivityCategory.nature, 0.0, 90, 4.5, "07:00", "20:00"),
        ("Desert Safari & BBQ Dinner", ActivityCategory.adventure, 250.0, 300, 4.7, "15:00", "21:00"),
    ],
    "Doha": [
        ("Museum of Islamic Art", ActivityCategory.museum, 0.0, 120, 4.7, "09:00", "19:00"),
        ("Souq Waqif Market Walk", ActivityCategory.shopping, 0.0, 150, 4.6, "10:00", "23:00"),
        ("The Pearl-Qatar Waterfront", ActivityCategory.attraction, 0.0, 90, 4.4, "10:00", "22:00"),
        ("Doha Desert Safari", ActivityCategory.adventure, 250.0, 300, 4.6, "14:00", "20:00"),
        ("Katara Cultural Village", ActivityCategory.culture, 0.0, 120, 4.4, "09:00", "22:00"),
    ],
    "Muscat": [
        ("Sultan Qaboos Grand Mosque", ActivityCategory.religious, 0.0, 60, 4.8, "08:00", "11:00"),
        ("Muttrah Souq Shopping", ActivityCategory.shopping, 0.0, 120, 4.5, "09:00", "22:00"),
        ("Mutrah Corniche Walk", ActivityCategory.nature, 0.0, 90, 4.5, "16:00", "20:00"),
        ("Wadi Shab Canyon Hike", ActivityCategory.adventure, 5.0, 240, 4.7, "07:00", "16:00"),
        ("Royal Opera House Muscat", ActivityCategory.entertainment, 40.0, 150, 4.6, "19:00", "22:00"),
    ],
    "Amman": [
        ("Roman Theatre of Amman", ActivityCategory.attraction, 3.0, 60, 4.5, "08:00", "17:00"),
        ("Citadel Hill Visit", ActivityCategory.culture, 3.0, 90, 4.5, "08:00", "17:00"),
        ("Rainbow Street Food Walk", ActivityCategory.food, 15.0, 150, 4.6, "17:00", "21:00"),
        ("Petra Day Trip", ActivityCategory.adventure, 70.0, 600, 4.9, "06:00", "19:00"),
        ("Jordanian Mansaf Dinner Experience", ActivityCategory.food, 25.0, 120, 4.6, "19:00", "21:30"),
    ],

    # --- Africa ---
    "Cape Town": [
        ("Table Mountain Cable Car", ActivityCategory.nature, 385.0, 120, 4.8, "08:00", "18:00"),
        ("Robben Island Ferry Tour", ActivityCategory.culture, 600.0, 210, 4.7, "09:00", "16:00"),
        ("V&A Waterfront Walk", ActivityCategory.shopping, 0.0, 90, 4.5, "09:00", "21:00"),
        ("Cape Winelands Tour", ActivityCategory.food, 900.0, 300, 4.7, "09:00", "16:00"),
        ("Boulders Beach Penguin Colony", ActivityCategory.nature, 180.0, 90, 4.6, "08:00", "17:00"),
    ],
    "Marrakech": [
        ("Jemaa el-Fnaa Square Evening", ActivityCategory.culture, 0.0, 120, 4.6, "17:00", "23:00"),
        ("Majorelle Garden Visit", ActivityCategory.nature, 150.0, 90, 4.6, "08:00", "18:00"),
        ("Bahia Palace Tour", ActivityCategory.attraction, 70.0, 60, 4.5, "09:00", "17:00"),
        ("Marrakech Souk Shopping", ActivityCategory.shopping, 0.0, 150, 4.4, "09:00", "20:00"),
        ("Atlas Mountains Day Trip", ActivityCategory.adventure, 400.0, 480, 4.7, "08:00", "18:00"),
    ],
    "Cairo": [
        ("Pyramids of Giza & Sphinx Tour", ActivityCategory.attraction, 540.0, 180, 4.9, "08:00", "17:00"),
        ("Egyptian Museum Visit", ActivityCategory.museum, 450.0, 150, 4.7, "09:00", "17:00"),
        ("Khan el-Khalili Bazaar", ActivityCategory.shopping, 0.0, 150, 4.5, "10:00", "23:00"),
        ("Nile River Dinner Cruise", ActivityCategory.food, 700.0, 150, 4.6, "19:00", "22:00"),
        ("Islamic Cairo Walking Tour", ActivityCategory.culture, 300.0, 150, 4.5, "09:00", "17:00"),
    ],
    "Zanzibar City": [
        ("Stone Town Heritage Walk", ActivityCategory.culture, 0.0, 120, 4.6, "09:00", "18:00"),
        ("Spice Farm Tour", ActivityCategory.nature, 25000.0, 180, 4.6, "09:00", "13:00"),
        ("Prison Island Tortoise Sanctuary", ActivityCategory.adventure, 40000.0, 180, 4.5, "09:00", "16:00"),
        ("Nungwi Beach Sunset", ActivityCategory.nature, 0.0, 120, 4.7, "16:30", "19:00"),
        ("Zanzibar Dhow Sunset Cruise", ActivityCategory.food, 60000.0, 150, 4.6, "16:00", "19:00"),
    ],
    "Nairobi": [
        ("Nairobi National Park Safari", ActivityCategory.adventure, 4300.0, 240, 4.7, "06:30", "18:00"),
        ("Giraffe Centre Visit", ActivityCategory.nature, 1500.0, 60, 4.6, "09:00", "17:30"),
        ("David Sheldrick Elephant Orphanage", ActivityCategory.nature, 1000.0, 60, 4.7, "11:00", "12:00"),
        ("Maasai Market Shopping", ActivityCategory.shopping, 0.0, 120, 4.4, "09:00", "18:00"),
        ("Karen Blixen Museum", ActivityCategory.museum, 1500.0, 90, 4.4, "09:30", "18:00"),
    ],

    # --- Americas ---
    "Rio de Janeiro": [
        ("Christ the Redeemer Tour", ActivityCategory.attraction, 100.0, 150, 4.8, "08:00", "19:00"),
        ("Sugarloaf Mountain Cable Car", ActivityCategory.nature, 130.0, 120, 4.7, "08:00", "21:00"),
        ("Copacabana Beach Day", ActivityCategory.nature, 0.0, 240, 4.5, "07:00", "18:00"),
        ("Santa Teresa Neighborhood Walk", ActivityCategory.culture, 0.0, 120, 4.5, "10:00", "18:00"),
        ("Samba Show & Dinner", ActivityCategory.entertainment, 180.0, 150, 4.6, "20:00", "23:00"),
    ],
    "Buenos Aires": [
        ("Recoleta Cemetery Tour", ActivityCategory.culture, 0.0, 90, 4.6, "08:00", "18:00"),
        ("La Boca & Caminito Walk", ActivityCategory.culture, 0.0, 120, 4.5, "10:00", "18:00"),
        ("Tango Show in San Telmo", ActivityCategory.entertainment, 15000.0, 120, 4.7, "20:30", "23:00"),
        ("Buenos Aires Steakhouse Dinner", ActivityCategory.food, 20000.0, 120, 4.7, "20:00", "23:00"),
        ("Teatro Colón Tour", ActivityCategory.attraction, 6000.0, 60, 4.6, "10:00", "17:00"),
    ],
    "Cusco": [
        ("Machu Picchu Day Trip", ActivityCategory.adventure, 250.0, 720, 4.9, "05:00", "20:00"),
        ("Sacsayhuamán Ruins Walk", ActivityCategory.culture, 70.0, 90, 4.6, "07:00", "18:00"),
        ("Sacred Valley Tour", ActivityCategory.nature, 60.0, 480, 4.7, "08:00", "18:00"),
        ("Cusco Cathedral Visit", ActivityCategory.religious, 40.0, 60, 4.5, "10:00", "18:00"),
        ("Peruvian Cooking Class", ActivityCategory.food, 90.0, 180, 4.7, "10:00", "14:00"),
    ],
    "Mexico City": [
        ("Teotihuacan Pyramids Day Trip", ActivityCategory.adventure, 900.0, 360, 4.7, "08:00", "16:00"),
        ("Frida Kahlo Museum", ActivityCategory.museum, 270.0, 90, 4.7, "10:00", "17:00"),
        ("Zócalo & Metropolitan Cathedral", ActivityCategory.attraction, 0.0, 90, 4.5, "08:00", "20:00"),
        ("Xochimilco Canal Boat Tour", ActivityCategory.entertainment, 600.0, 150, 4.5, "10:00", "18:00"),
        ("Mexican Street Food Tour", ActivityCategory.food, 500.0, 180, 4.8, "17:00", "21:00"),
    ],
    "Toronto": [
        ("CN Tower EdgeWalk", ActivityCategory.adventure, 225.0, 90, 4.7, "10:00", "20:00"),
        ("Niagara Falls Day Trip", ActivityCategory.nature, 140.0, 480, 4.8, "08:00", "18:00"),
        ("Kensington Market Food Tour", ActivityCategory.food, 60.0, 150, 4.6, "11:00", "15:00"),
        ("Royal Ontario Museum", ActivityCategory.museum, 23.0, 120, 4.5, "10:00", "17:30"),
        ("Toronto Islands Bike Ride", ActivityCategory.nature, 10.0, 150, 4.5, "09:00", "18:00"),
    ],
    "San Francisco": [
        ("Golden Gate Bridge Walk", ActivityCategory.attraction, 0.0, 90, 4.8, "06:00", "20:00"),
        ("Alcatraz Island Tour", ActivityCategory.culture, 45.0, 150, 4.8, "09:00", "16:00"),
        ("Fisherman's Wharf Visit", ActivityCategory.attraction, 0.0, 120, 4.4, "09:00", "21:00"),
        ("Cable Car Ride", ActivityCategory.attraction, 8.0, 45, 4.5, "07:00", "22:00"),
        ("Napa Valley Wine Tour", ActivityCategory.food, 150.0, 420, 4.7, "09:00", "17:00"),
    ],
    "Los Angeles": [
        ("Hollywood Walk of Fame Tour", ActivityCategory.attraction, 0.0, 90, 4.3, "09:00", "21:00"),
        ("Griffith Observatory Visit", ActivityCategory.museum, 0.0, 90, 4.7, "12:00", "22:00"),
        ("Santa Monica Pier", ActivityCategory.entertainment, 0.0, 120, 4.5, "09:00", "22:00"),
        ("Universal Studios Hollywood", ActivityCategory.entertainment, 120.0, 360, 4.6, "09:00", "20:00"),
        ("Getty Center Museum", ActivityCategory.museum, 0.0, 150, 4.7, "10:00", "17:30"),
    ],
    "Miami": [
        ("South Beach Day", ActivityCategory.nature, 0.0, 240, 4.5, "08:00", "18:00"),
        ("Little Havana Food Tour", ActivityCategory.food, 65.0, 150, 4.6, "11:00", "15:00"),
        ("Everglades Airboat Tour", ActivityCategory.adventure, 45.0, 120, 4.6, "09:00", "17:00"),
        ("Wynwood Walls Street Art", ActivityCategory.culture, 12.0, 90, 4.5, "10:00", "19:00"),
        ("Miami Design District Walk", ActivityCategory.shopping, 0.0, 90, 4.3, "10:00", "20:00"),
    ],
    "Vancouver": [
        ("Stanley Park Bike Ride", ActivityCategory.nature, 15.0, 120, 4.7, "08:00", "20:00"),
        ("Capilano Suspension Bridge", ActivityCategory.adventure, 55.0, 120, 4.6, "09:00", "18:00"),
        ("Granville Island Market", ActivityCategory.food, 0.0, 90, 4.5, "09:00", "19:00"),
        ("Grouse Mountain Hike", ActivityCategory.adventure, 59.0, 240, 4.6, "09:00", "17:00"),
        ("Whale Watching Tour", ActivityCategory.adventure, 130.0, 210, 4.7, "09:00", "16:00"),
    ],
    "Havana": [
        ("Old Havana Walking Tour", ActivityCategory.culture, 15.0, 150, 4.7, "09:00", "18:00"),
        ("Classic Car City Tour", ActivityCategory.attraction, 40.0, 90, 4.7, "10:00", "20:00"),
        ("Malecón Sunset Walk", ActivityCategory.nature, 0.0, 90, 4.6, "17:30", "19:30"),
        ("Cuban Cigar & Rum Tasting", ActivityCategory.food, 35.0, 90, 4.6, "16:00", "19:00"),
        ("Live Salsa Music Night", ActivityCategory.nightlife, 20.0, 150, 4.5, "21:00", "23:59"),
    ],

    # --- Oceania ---
    "Sydney": [
        ("Sydney Opera House Tour", ActivityCategory.attraction, 43.0, 60, 4.8, "09:00", "17:00"),
        ("Sydney Harbour Bridge Climb", ActivityCategory.adventure, 250.0, 210, 4.8, "07:00", "19:00"),
        ("Bondi to Coogee Coastal Walk", ActivityCategory.nature, 0.0, 150, 4.7, "07:00", "18:00"),
        ("Taronga Zoo Visit", ActivityCategory.entertainment, 51.0, 180, 4.5, "09:30", "17:00"),
        ("Blue Mountains Day Trip", ActivityCategory.nature, 130.0, 480, 4.7, "08:00", "18:00"),
    ],
    "Melbourne": [
        ("Great Ocean Road Day Trip", ActivityCategory.nature, 140.0, 600, 4.8, "07:30", "19:00"),
        ("Melbourne Laneways Street Art Walk", ActivityCategory.culture, 0.0, 90, 4.6, "10:00", "18:00"),
        ("Queen Victoria Market", ActivityCategory.food, 0.0, 120, 4.5, "08:00", "16:00"),
        ("Royal Botanic Gardens", ActivityCategory.nature, 0.0, 90, 4.6, "07:30", "18:00"),
        ("Melbourne Coffee Culture Tour", ActivityCategory.food, 60.0, 120, 4.6, "09:00", "12:00"),
    ],
    "Auckland": [
        ("Sky Tower Observation Deck", ActivityCategory.attraction, 35.0, 60, 4.6, "09:00", "22:00"),
        ("Waiheke Island Wine Tour", ActivityCategory.food, 150.0, 360, 4.7, "09:00", "16:00"),
        ("Auckland Domain & Museum", ActivityCategory.museum, 25.0, 120, 4.5, "10:00", "17:00"),
        ("Rangitoto Island Hike", ActivityCategory.nature, 45.0, 240, 4.6, "08:00", "16:00"),
        ("Harbour Bridge Bungy Jump", ActivityCategory.adventure, 195.0, 90, 4.7, "10:00", "17:00"),
    ],
    "Queenstown": [
        ("Milford Sound Day Cruise", ActivityCategory.nature, 195.0, 660, 4.9, "07:00", "19:00"),
        ("Queenstown Bungy Jump", ActivityCategory.adventure, 275.0, 90, 4.8, "09:00", "17:00"),
        ("Skyline Gondola & Luge", ActivityCategory.entertainment, 65.0, 90, 4.6, "09:00", "21:00"),
        ("Shotover Jet Boat Ride", ActivityCategory.adventure, 149.0, 60, 4.7, "09:00", "17:00"),
        ("Queenstown Wine Trail", ActivityCategory.food, 140.0, 240, 4.6, "10:00", "16:00"),
    ],

    # --- India (expanded) ---
    "Agra": [
        ("Taj Mahal Sunrise Tour", ActivityCategory.attraction, 1100.0, 150, 4.9, "06:00", "10:00"),
        ("Agra Fort Visit", ActivityCategory.attraction, 650.0, 120, 4.6, "06:00", "18:00"),
        ("Mehtab Bagh Sunset View", ActivityCategory.nature, 300.0, 60, 4.5, "17:00", "19:00"),
        ("Fatehpur Sikri Day Trip", ActivityCategory.culture, 550.0, 240, 4.5, "07:00", "17:00"),
        ("Agra Marble Inlay Workshop", ActivityCategory.shopping, 0.0, 90, 4.3, "10:00", "18:00"),
    ],
    "Varanasi": [
        ("Ganges River Sunrise Boat Ride", ActivityCategory.nature, 500.0, 90, 4.8, "05:00", "07:00"),
        ("Evening Ganga Aarti Ceremony", ActivityCategory.religious, 0.0, 60, 4.8, "18:00", "19:30"),
        ("Sarnath Buddhist Site Visit", ActivityCategory.religious, 300.0, 120, 4.5, "08:00", "17:00"),
        ("Varanasi Old City Walk", ActivityCategory.culture, 0.0, 150, 4.6, "09:00", "18:00"),
        ("Banarasi Silk Weaving Tour", ActivityCategory.shopping, 200.0, 90, 4.4, "10:00", "18:00"),
    ],
    "Udaipur": [
        ("City Palace Udaipur Tour", ActivityCategory.attraction, 300.0, 120, 4.7, "09:30", "17:30"),
        ("Lake Pichola Boat Ride", ActivityCategory.nature, 700.0, 60, 4.7, "10:00", "18:00"),
        ("Jagdish Temple Visit", ActivityCategory.religious, 0.0, 45, 4.5, "05:00", "21:00"),
        ("Sajjangarh Monsoon Palace", ActivityCategory.attraction, 200.0, 90, 4.4, "09:00", "18:00"),
        ("Udaipur Rooftop Dinner", ActivityCategory.food, 1200.0, 120, 4.7, "19:00", "22:00"),
    ],
    "Kochi": [
        ("Fort Kochi Heritage Walk", ActivityCategory.culture, 0.0, 120, 4.6, "09:00", "18:00"),
        ("Chinese Fishing Nets Visit", ActivityCategory.attraction, 0.0, 45, 4.4, "07:00", "19:00"),
        ("Kathakali Dance Show", ActivityCategory.entertainment, 400.0, 90, 4.6, "18:00", "20:00"),
        ("Backwater Houseboat Cruise", ActivityCategory.nature, 3500.0, 300, 4.8, "10:00", "17:00"),
        ("Spice Market Tour", ActivityCategory.shopping, 0.0, 90, 4.4, "10:00", "18:00"),
    ],
    "Amritsar": [
        ("Golden Temple Visit", ActivityCategory.religious, 0.0, 120, 4.9, "04:00", "22:00"),
        ("Wagah Border Ceremony", ActivityCategory.culture, 0.0, 90, 4.7, "16:30", "18:30"),
        ("Jallianwala Bagh Memorial", ActivityCategory.culture, 0.0, 60, 4.5, "06:00", "19:00"),
        ("Amritsari Kulcha Food Tour", ActivityCategory.food, 400.0, 120, 4.7, "12:00", "15:00"),
        ("Partition Museum Visit", ActivityCategory.museum, 100.0, 90, 4.5, "10:00", "18:00"),
    ],
    "Bengaluru": [
        ("Lalbagh Botanical Garden", ActivityCategory.nature, 30.0, 90, 4.5, "06:00", "19:00"),
        ("Bangalore Palace Tour", ActivityCategory.attraction, 460.0, 90, 4.4, "10:00", "17:30"),
        ("Nandi Hills Sunrise Trek", ActivityCategory.adventure, 0.0, 240, 4.6, "05:00", "10:00"),
        ("MG Road & Brigade Road Shopping", ActivityCategory.shopping, 0.0, 150, 4.3, "10:00", "21:00"),
        ("Bengaluru Craft Beer Trail", ActivityCategory.nightlife, 1200.0, 150, 4.5, "18:00", "23:00"),
    ],
    "Chennai": [
        ("Marina Beach Walk", ActivityCategory.nature, 0.0, 90, 4.4, "05:30", "20:00"),
        ("Kapaleeshwarar Temple Visit", ActivityCategory.religious, 0.0, 60, 4.6, "05:30", "21:00"),
        ("Mahabalipuram Shore Temple Day Trip", ActivityCategory.culture, 600.0, 300, 4.7, "07:00", "17:00"),
        ("Chennai Filter Coffee & Dosa Trail", ActivityCategory.food, 500.0, 150, 4.7, "07:00", "10:00"),
        ("Fort St. George Museum", ActivityCategory.museum, 15.0, 90, 4.3, "09:00", "17:00"),
    ],
    "Kolkata": [
        ("Victoria Memorial Visit", ActivityCategory.museum, 30.0, 90, 4.6, "10:00", "17:00"),
        ("Howrah Bridge & Ganges Walk", ActivityCategory.attraction, 0.0, 60, 4.5, "06:00", "20:00"),
        ("Kolkata Street Food Trail", ActivityCategory.food, 500.0, 150, 4.8, "17:00", "21:00"),
        ("Indian Museum Kolkata", ActivityCategory.museum, 50.0, 90, 4.3, "10:00", "17:00"),
        ("College Street Book Market", ActivityCategory.shopping, 0.0, 90, 4.4, "10:00", "19:00"),
    ],
    "Shimla": [
        ("The Ridge & Mall Road Walk", ActivityCategory.attraction, 0.0, 90, 4.5, "08:00", "21:00"),
        ("Jakhoo Temple Hike", ActivityCategory.religious, 0.0, 120, 4.4, "06:00", "18:00"),
        ("Kalka-Shimla Toy Train Ride", ActivityCategory.adventure, 300.0, 300, 4.7, "06:00", "17:00"),
        ("Christ Church Shimla", ActivityCategory.religious, 0.0, 45, 4.3, "09:00", "18:00"),
        ("Shimla Apple Orchard Visit", ActivityCategory.nature, 400.0, 150, 4.4, "10:00", "16:00"),
    ],
    "Rishikesh": [
        ("Laxman Jhula & Ram Jhula Walk", ActivityCategory.attraction, 0.0, 90, 4.5, "06:00", "20:00"),
        ("Ganga Aarti at Triveni Ghat", ActivityCategory.religious, 0.0, 60, 4.8, "18:00", "19:30"),
        ("White Water Rafting on the Ganges", ActivityCategory.adventure, 800.0, 150, 4.7, "09:00", "15:00"),
        ("Beatles Ashram Visit", ActivityCategory.culture, 150.0, 90, 4.4, "09:00", "17:00"),
        ("Rishikesh Yoga & Meditation Class", ActivityCategory.entertainment, 500.0, 90, 4.6, "06:30", "18:00"),
    ],
    "Ahmedabad": [
        ("Sabarmati Ashram Visit", ActivityCategory.culture, 0.0, 90, 4.6, "08:30", "18:30"),
        ("Adalaj Stepwell Tour", ActivityCategory.attraction, 0.0, 60, 4.6, "08:00", "18:00"),
        ("Manek Chowk Night Food Market", ActivityCategory.food, 400.0, 150, 4.7, "20:00", "23:59"),
        ("Sidi Saiyyed Mosque", ActivityCategory.religious, 0.0, 30, 4.4, "07:00", "19:00"),
        ("Kankaria Lake Walk", ActivityCategory.nature, 20.0, 90, 4.3, "09:00", "21:00"),
    ],
}

DEMO_USERS = [
    dict(name="Asha Kulkarni", email="demo@globetrotter.app", password="Demo1234!", language="en"),
    dict(name="Rohan Mehta", email="rohan@globetrotter.app", password="Demo1234!", language="en"),
    dict(name="Priya Nair", email="priya@globetrotter.app", password="Demo1234!", language="en"),
    dict(name="Globetrotter Admin", email="admin@globetrotter.app", password="Admin1234!", language="en", role=UserRole.admin),
]


def get_or_create_destination(db, data: dict) -> Destination:
    existing = db.query(Destination).filter(Destination.city == data["city"]).first()
    if existing:
        return existing
    dest = Destination(**data)
    db.add(dest)
    db.flush()
    return dest


def get_or_create_activity(db, destination_id: str, name: str, category, price, duration, rating, opening, closing) -> Activity:
    existing = db.query(Activity).filter(Activity.destination_id == destination_id, Activity.name == name).first()
    if existing:
        return existing
    dest = db.get(Destination, destination_id)
    activity = Activity(
        destination_id=destination_id,
        name=name,
        description=f"{name} - a top-rated experience in {dest.city}.",
        category=category,
        image_url=photo(f"{dest.city}-{name}"),
        latitude=dest.latitude,
        longitude=dest.longitude,
        price=price,
        currency=dest.currency,
        duration_minutes=duration,
        rating=rating,
        opening_time=opening,
        closing_time=closing,
    )
    db.add(activity)
    db.flush()
    return activity


def get_or_create_user(db, data: dict) -> User:
    existing = db.query(User).filter(User.email == data["email"]).first()
    if existing:
        return existing
    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        language=data["language"],
        role=data.get("role", UserRole.user),
    )
    db.add(user)
    db.flush()
    db.add(UserPreference(user_id=user.id, travel_style="Balanced", interests=["Culture", "Food"]))
    return user


def build_sample_trip(db, user: User, dest_map: dict[str, Destination], act_map: dict[str, dict[str, Activity]]):
    existing = db.query(Trip).filter(Trip.user_id == user.id, Trip.name == "Paris & London Getaway").first()
    if existing:
        return

    start = date.today() + timedelta(days=14)
    trip = Trip(
        user_id=user.id,
        name="Paris & London Getaway",
        description="A romantic week hopping between two of Europe's most iconic capitals.",
        start_date=start,
        end_date=start + timedelta(days=6),
        cover_image=photo("paris-london-trip"),
        visibility=TripVisibility.public,
        status=TripStatus.planned,
        budget_total=2200.0,
        currency="EUR",
    )
    import uuid as _uuid
    trip.share_id = str(_uuid.uuid4())
    db.add(trip)
    db.flush()

    paris_stop = TripStop(trip_id=trip.id, destination_id=dest_map["Paris"].id, arrival_date=start,
                           departure_date=start + timedelta(days=3), sequence=0)
    london_stop = TripStop(trip_id=trip.id, destination_id=dest_map["London"].id,
                            arrival_date=start + timedelta(days=3), departure_date=start + timedelta(days=6), sequence=1)
    db.add_all([paris_stop, london_stop])
    db.flush()

    paris_activities = list(act_map["Paris"].values())
    for i, act in enumerate(paris_activities[:4]):
        db.add(ItineraryActivity(
            trip_id=trip.id, trip_stop_id=paris_stop.id, activity_id=act.id,
            date=start + timedelta(days=i % 3), start_time=["09:00", "13:00", "15:30", "19:00"][i % 4],
            sequence=i,
        ))

    london_activities = list(act_map["London"].values())
    for i, act in enumerate(london_activities[:4]):
        db.add(ItineraryActivity(
            trip_id=trip.id, trip_stop_id=london_stop.id, activity_id=act.id,
            date=start + timedelta(days=3 + (i % 3)), start_time=["10:00", "13:00", "16:00", "19:30"][i % 4],
            sequence=i,
        ))

    budget_rows = [
        (BudgetCategory.accommodation, 650.0, "Hotels in Paris & London"),
        (BudgetCategory.transportation, 320.0, "Eurostar + local transit"),
        (BudgetCategory.food, 380.0, "Restaurants and cafes"),
        (BudgetCategory.activities, 410.0, "Tours and attractions"),
        (BudgetCategory.shopping, 90.0, "Souvenirs"),
    ]
    for category, amount, desc in budget_rows:
        db.add(BudgetRecord(trip_id=trip.id, category=category, amount=amount, currency="EUR",
                             description=desc, date=start))

    draft_trip = Trip(
        user_id=user.id,
        name="Golden Triangle: Delhi, Jaipur & Goa",
        description="Classic North India culture followed by beach relaxation in Goa.",
        start_date=start + timedelta(days=40),
        end_date=start + timedelta(days=48),
        cover_image=photo("golden-triangle-trip"),
        visibility=TripVisibility.private,
        status=TripStatus.draft,
        budget_total=60000.0,
        currency="INR",
    )
    db.add(draft_trip)
    db.flush()
    for i, city in enumerate(["Delhi", "Jaipur", "Goa"]):
        db.add(TripStop(trip_id=draft_trip.id, destination_id=dest_map[city].id, sequence=i))


def main():
    db = SessionLocal()
    try:
        dest_map: dict[str, Destination] = {}
        for data in DESTINATIONS:
            dest_map[data["city"]] = get_or_create_destination(db, data)
        db.commit()

        act_map: dict[str, dict[str, Activity]] = {}
        for city, activities in ACTIVITIES.items():
            act_map[city] = {}
            for name, category, price, duration, rating, opening, closing in activities:
                act_map[city][name] = get_or_create_activity(
                    db, dest_map[city].id, name, category, price, duration, rating, opening, closing
                )
        db.commit()

        users = [get_or_create_user(db, u) for u in DEMO_USERS]
        db.commit()

        build_sample_trip(db, users[0], dest_map, act_map)
        db.commit()

        print(f"Seeded {len(dest_map)} destinations, "
              f"{sum(len(v) for v in act_map.values())} activities, "
              f"{len(users)} demo users.")
        print("Demo login: demo@globetrotter.app / Demo1234!")
        print("Admin login: admin@globetrotter.app / Admin1234!")
    finally:
        db.close()


if __name__ == "__main__":
    main()
