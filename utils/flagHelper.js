// Mapping of 3-letter IOC/ISO codes to 2-letter ISO codes (Required for Emoji math)
const IOC_TO_ISO = {
    // --- A ---
    'AFG': 'AF', 'ALB': 'AL', 'ALG': 'DZ', 'AND': 'AD', 'ANG': 'AO',
    'ANT': 'AG', 'ARG': 'AR', 'ARM': 'AM', 'ARU': 'AW', 'ASA': 'AS',
    'AUS': 'AU', 'AUT': 'AT', 'AZE': 'AZ',
    // --- B ---
    'BAH': 'BS', 'BAN': 'BD', 'BAR': 'BB', 'BDI': 'BI', 'BEL': 'BE',
    'BEN': 'BJ', 'BER': 'BM', 'BHU': 'BT', 'BIH': 'BA', 'BIZ': 'BZ',
    'BLR': 'BY', 'BOL': 'BO', 'BOT': 'BW', 'BRA': 'BR', 'BRN': 'BH',
    'BRU': 'BN', 'BUL': 'BG', 'BUR': 'BF', 'CAF': 'CF', 'CAM': 'KH',
    // --- C ---
    'CAN': 'CA', 'CAY': 'KY', 'CGO': 'CG', 'CHA': 'TD', 'CHI': 'CL',
    'CHN': 'CN', 'CIV': 'CI', 'CMR': 'CM', 'COD': 'CD', 'COK': 'CK',
    'COL': 'CO', 'COM': 'KM', 'CPV': 'CV', 'CRC': 'CR', 'CRO': 'HR',
    'CUB': 'CU', 'CYP': 'CY', 'CZE': 'CZ',
    // --- D ---
    'DEN': 'DK', 'DJI': 'DJ', 'DMA': 'DM', 'DOM': 'DO',
    // --- E ---
    'ECU': 'EC', 'EGY': 'EG', 'ERI': 'ER', 'ESA': 'SV', 'ESP': 'ES',
    'EST': 'EE', 'ETH': 'ET',
    // --- F ---
    'FIJ': 'FJ', 'FIN': 'FI', 'FRA': 'FR', 'FSM': 'FM',
    // --- G ---
    'GAB': 'GA', 'GAM': 'GM', 'GBR': 'GB', 'GBS': 'GW', 'GEO': 'GE',
    'GEQ': 'GQ', 'GER': 'DE', 'GHA': 'GH', 'GRE': 'GR', 'GRN': 'GD',
    'GUA': 'GT', 'GUI': 'GN', 'GUM': 'GU', 'GUY': 'GY',
    // --- H ---
    'HAI': 'HT', 'HKG': 'HK', 'HON': 'HN', 'HUN': 'HU',
    // --- I ---
    'INA': 'ID', 'IND': 'IN', 'IRI': 'IR', 'IRL': 'IE', 'IRQ': 'IQ',
    'ISL': 'IS', 'ISR': 'IL', 'ISV': 'VI', 'ITA': 'IT', 'IVB': 'VG',
    // --- J ---
    'JAM': 'JM', 'JOR': 'JO', 'JPN': 'JP',
    // --- K ---
    'KAZ': 'KZ', 'KEN': 'KE', 'KGZ': 'KG', 'KIR': 'KI', 'KOR': 'KR',
    'KOS': 'XK', 'KSA': 'SA', 'KUW': 'KW',
    // --- L ---
    'LAO': 'LA', 'LAT': 'LV', 'LBA': 'LY', 'LBR': 'LR', 'LCA': 'LC',
    'LES': 'LS', 'LIB': 'LB', 'LIE': 'LI', 'LTU': 'LT', 'LUX': 'LU',
    // --- M ---
    'MAD': 'MG', 'MAR': 'MA', 'MAS': 'MY', 'MAW': 'MW', 'MDA': 'MD',
    'MDV': 'MV', 'MEX': 'MX', 'MGL': 'MN', 'MHL': 'MH', 'MKD': 'MK',
    'MLI': 'ML', 'MLT': 'MT', 'MNE': 'ME', 'MON': 'MC', 'MOZ': 'MZ',
    'MRI': 'MU', 'MTN': 'MR', 'MYA': 'MM',
    // --- N ---
    'NAM': 'NA', 'NCA': 'NI', 'NED': 'NL', 'NEP': 'NP', 'NGR': 'NG',
    'NIG': 'NE', 'NOR': 'NO', 'NRU': 'NR', 'NZL': 'NZ',
    // --- O ---
    'OMA': 'OM',
    // --- P ---
    'PAK': 'PK', 'PAN': 'PA', 'PAR': 'PY', 'PER': 'PE', 'PHI': 'PH',
    'PLE': 'PS', 'PLW': 'PW', 'PNG': 'PG', 'POL': 'PL', 'POR': 'PT',
    'PRK': 'KP', 'PUR': 'PR',
    // --- Q ---
    'QAT': 'QA',
    // --- R ---
    'ROU': 'RO', 'RSA': 'ZA', 'RUS': 'RU', 'RWA': 'RW',
    // --- S ---
    'SAM': 'WS', 'SEN': 'SN', 'SEY': 'SC', 'SGP': 'SG', 'SKN': 'KN',
    'SLE': 'SL', 'SLO': 'SI', 'SMR': 'SM', 'SOL': 'SB', 'SOM': 'SO',
    'SRB': 'RS', 'SRI': 'LK', 'SSD': 'SS', 'STP': 'ST', 'SUD': 'SD',
    'SUI': 'CH', 'SUR': 'SR', 'SVK': 'SK', 'SWE': 'SE', 'SWZ': 'SZ',
    'SYR': 'SY',
    // --- T ---
    'TAN': 'TZ', 'TGA': 'TO', 'THA': 'TH', 'TJK': 'TJ', 'TKM': 'TM',
    'TLS': 'TL', 'TOG': 'TG', 'TPE': 'TW', 'TRI': 'TT', 'TTO': 'TT',
    'TUN': 'TN', 'TUR': 'TR', 'TUV': 'TV',
    // --- U ---
    'UAE': 'AE', 'UGA': 'UG', 'UKR': 'UA', 'URU': 'UY', 'USA': 'US',
    'UZB': 'UZ',
    // --- V ---
    'VAN': 'VU', 'VEN': 'VE', 'VIE': 'VN', 'VIN': 'VC',
    // --- Y ---
    'YEM': 'YE',
    // --- Z ---
    'ZAM': 'ZM', 'ZIM': 'ZW',
    // Special Cases / Legacy
    'ROC': 'RU', // Russian Olympic Committee -> Russia
    'EOR': '',   // Refugee Olympic Team (No standard flag emoji, or use 🏳️)
};

export const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '';

    // 1. Clean the input
    const code = countryCode.toUpperCase().trim();

    // 2. Try to find a mapped 2-letter code
    let isoCode = IOC_TO_ISO[code];

    // If no map found, but input is ALREADY 2 letters (e.g. "US"), assume it's valid.
    if (!isoCode && code.length === 2) {
        isoCode = code;
    }

    // 3. If we still don't have a 2-letter code, return the text
    if (!isoCode || isoCode.length !== 2) return countryCode;

    // 4. Magic Math: Convert 2-letter ISO code to Flag Emoji
    const offset = 127397;
    return isoCode
        .split('')
        .map(char => String.fromCodePoint(char.charCodeAt(0) + offset))
        .join('');
};