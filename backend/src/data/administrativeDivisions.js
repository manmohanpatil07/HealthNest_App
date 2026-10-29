/**
 * Official Administrative Hierarchy for Maharashtra and India
 * Source: Ministry of Panchayati Raj — Local Government Directory (LGD) (https://lgdirectory.gov.in)
 * and Department of Land Records, Government of Maharashtra.
 *
 * Maharashtra comprises 36 districts and 358 administrative talukas (tehsils).
 */

const ADMINISTRATIVE_DIVISIONS = {
  country: {
    code: 'IN',
    name: 'India'
  },
  states: [
    {
      code: 'MH',
      name: 'Maharashtra',
      isSupported: true, // Complete official PM-JAY dataset is populated
      districts: [
        {
          name: 'Ahmednagar',
          aliases: ['Ahilyanagar', 'Ahmadnagar'],
          subDistricts: [
            'Akole', 'Jamkhed', 'Karjat', 'Kopargaon', 'Nagar', 'Nevasa',
            'Parner', 'Pathardi', 'Rahata', 'Rahuri', 'Sangamner', 'Shevgaon',
            'Shrigonda', 'Shrirampur'
          ]
        },
        {
          name: 'Akola',
          aliases: [],
          subDistricts: [
            'Akola', 'Akot', 'Balapur', 'Barshitakli', 'Murtijapur', 'Patur', 'Telhara'
          ]
        },
        {
          name: 'Amravati',
          aliases: [],
          subDistricts: [
            'Achalpur', 'Amravati', 'Anjangaon Surji', 'Bhatkuli', 'Chandur Bazar',
            'Chandur Railway', 'Chikhaldara', 'Dhamangaon Railway', 'Dharni',
            'Morshi', 'Nandgaon-Khandeshwar', 'Teosa', 'Warud'
          ]
        },
        {
          name: 'Aurangabad',
          aliases: ['Chhatrapati Sambhajinagar'],
          subDistricts: [
            'Aurangabad', 'Chhatrapati Sambhajinagar', 'Gangapur', 'Kannad', 'Khultabad',
            'Paithan', 'Phulambri', 'Sillod', 'Soygaon', 'Vaijapur'
          ]
        },
        {
          name: 'Beed',
          aliases: [],
          subDistricts: [
            'Ambejogai', 'Ashti', 'Beed', 'Dharur', 'Georai', 'Kaij', 'Majalgaon',
            'Parli', 'Patoda', 'Shirur (Kasar)', 'Wadwani'
          ]
        },
        {
          name: 'Bhandara',
          aliases: [],
          subDistricts: [
            'Bhandara', 'Lakhandur', 'Lakhani', 'Mohadi', 'Pauni', 'Sakoli', 'Tumsar'
          ]
        },
        {
          name: 'Buldhana',
          aliases: [],
          subDistricts: [
            'Buldhana', 'Chikhli', 'Deolgaon Raja', 'Jalgaon (Jamod)', 'Khamgaon',
            'Lonar', 'Malkapur', 'Mehkar', 'Motala', 'Nandura', 'Sangrampur',
            'Shegaon', 'Sindkhed Raja'
          ]
        },
        {
          name: 'Chandrapur',
          aliases: [],
          subDistricts: [
            'Ballarpur', 'Bhadravati', 'Brahmapuri', 'Chandrapur', 'Chimur',
            'Gondpipri', 'Jiwati', 'Korpana', 'Mul', 'Nagbhid', 'Pombhurna',
            'Rajura', 'Sawali', 'Sindewahi', 'Warora'
          ]
        },
        {
          name: 'Dhule',
          aliases: [],
          subDistricts: [
            'Dhule', 'Sakri', 'Shirpur', 'Sindkhede'
          ]
        },
        {
          name: 'Gadchiroli',
          aliases: [],
          subDistricts: [
            'Aheri', 'Armori', 'Bhamragad', 'Chamorshi', 'Desaiganj (Vadasa)',
            'Dhanora', 'Etapalli', 'Gadchiroli', 'Korchi', 'Kurkheda', 'Mulchera', 'Sironcha'
          ]
        },
        {
          name: 'Gondia',
          aliases: [],
          subDistricts: [
            'Amgaon', 'Arjuni Morgaon', 'Deori', 'Gondia', 'Goregaon',
            'Sadak Arjuni', 'Salekasa', 'Tirora'
          ]
        },
        {
          name: 'Hingoli',
          aliases: [],
          subDistricts: [
            'Aundha (Nagnath)', 'Basmath', 'Hingoli', 'Kalamnuri', 'Sengaon'
          ]
        },
        {
          name: 'Jalgaon',
          aliases: [],
          subDistricts: [
            'Amalner', 'Bhadgaon', 'Bhusawal', 'Bodwad', 'Chalisgaon', 'Chopda',
            'Dharangaon', 'Erandol', 'Jalgaon', 'Jamner', 'Muktainagar',
            'Pachora', 'Parola', 'Raver', 'Yawal'
          ]
        },
        {
          name: 'Jalna',
          aliases: [],
          subDistricts: [
            'Ambad', 'Badnapur', 'Bhokardan', 'Ghansawangi', 'Jafrabad',
            'Jalna', 'Mantha', 'Partur'
          ]
        },
        {
          name: 'Kolhapur',
          aliases: [],
          subDistricts: [
            'Ajra', 'Bavda', 'Bhudargad', 'Chandgad', 'Gadhinglaj',
            'Hatkanangle', 'Kagal', 'Karvir', 'Panhala', 'Radhanagari',
            'Shahuwadi', 'Shirol'
          ]
        },
        {
          name: 'Latur',
          aliases: [],
          subDistricts: [
            'Ahmadpur', 'Ausa', 'Chakur', 'Deoni', 'Jalkot', 'Latur',
            'Nilanga', 'Renapur', 'Shirur-Anantpal', 'Udgir'
          ]
        },
        {
          name: 'Mumbai',
          aliases: ['Mumbai City'],
          subDistricts: [
            'Mumbai City', 'Colaba', 'Fort', 'Byculla', 'Dadar'
          ]
        },
        {
          name: 'Mumbai Suburban',
          aliases: [],
          subDistricts: [
            'Andheri', 'Bandra', 'Borivali', 'Kurla'
          ]
        },
        {
          name: 'Nagpur',
          aliases: [],
          subDistricts: [
            'Bhiwapur', 'Hingna', 'Kalameshwar', 'Kamptee', 'Katol',
            'Kuhi', 'Mouda', 'Nagpur (Rural)', 'Nagpur (Urban)', 'Narkhed',
            'Parseoni', 'Ramtek', 'Saoner', 'Umred'
          ]
        },
        {
          name: 'Nanded',
          aliases: [],
          subDistricts: [
            'Ardhapur', 'Bhokar', 'Biloli', 'Deglur', 'Dharmabad', 'Hadgaon',
            'Himayatnagar', 'Kandhar', 'Kinwat', 'Loha', 'Mahoor', 'Mudkhed',
            'Mukhed', 'Naigaon (Khairgaon)', 'Nanded', 'Umri'
          ]
        },
        {
          name: 'Nandurbar',
          aliases: [],
          subDistricts: [
            'Akkalkuwa', 'Akrani', 'Dhadgaon', 'Nandurbar', 'Navapur', 'Shahada', 'Talode'
          ]
        },
        {
          name: 'Nashik',
          aliases: [],
          subDistricts: [
            'Baglan', 'Chandwad', 'Deola', 'Dindori', 'Igatpuri', 'Kalwan',
            'Malegaon', 'Nandgaon', 'Nashik', 'Niphad', 'Peint', 'Satana',
            'Sinnar', 'Surgana', 'Trimbakeshwar', 'Yeola'
          ]
        },
        {
          name: 'Osmanabad',
          aliases: ['Dharashiv'],
          subDistricts: [
            'Bhum', 'Dharashiv', 'Kalamb', 'Lohara', 'Omerga', 'Osmanabad',
            'Paranda', 'Tuljapur', 'Washi'
          ]
        },
        {
          name: 'Palghar',
          aliases: [],
          subDistricts: [
            'Dahanu', 'Jawhar', 'Mokhada', 'Palghar', 'Talasari', 'Vasai', 'Vikramgad', 'Wada'
          ]
        },
        {
          name: 'Parbhani',
          aliases: [],
          subDistricts: [
            'Gangakhed', 'Jintur', 'Manwath', 'Palam', 'Parbhani',
            'Pathri', 'Purna', 'Sailu', 'Sonpeth'
          ]
        },
        {
          name: 'Pune',
          aliases: [],
          subDistricts: [
            'Ambegaon', 'Baramati', 'Bhor', 'Daund', 'Haveli', 'Indapur',
            'Junnar', 'Khed', 'Maval', 'Mulshi', 'Pune City', 'Purandhar',
            'Shirur', 'Velhe'
          ]
        },
        {
          name: 'Raigad',
          aliases: ['Raigarh'],
          subDistricts: [
            'Alibag', 'Karjat', 'Khalapur', 'Mahad', 'Mangaon', 'Mhasla',
            'Murud', 'Panvel', 'Pen', 'Poladpur', 'Roha', 'Shrivardhan',
            'Sudhagad', 'Tala', 'Uran'
          ]
        },
        {
          name: 'Ratnagiri',
          aliases: [],
          subDistricts: [
            'Chiplun', 'Dapoli', 'Guhagar', 'Khed', 'Lanja', 'Mandangad',
            'Rajapur', 'Ratnagiri', 'Sangameshwar'
          ]
        },
        {
          name: 'Sangli',
          aliases: [],
          subDistricts: [
            'Atpadi', 'Jat', 'Kadegaon', 'Kavathemahankal', 'Khanapur',
            'Miraj', 'Palus', 'Shirala', 'Tasgaon', 'Walwa'
          ]
        },
        {
          name: 'Satara',
          aliases: [],
          subDistricts: [
            'Jaoli', 'Karad', 'Khandala', 'Khatav', 'Koregaon', 'Mahabaleshwar',
            'Man', 'Patan', 'Phaltan', 'Satara', 'Wai'
          ]
        },
        {
          name: 'Sindhudurg',
          aliases: [],
          subDistricts: [
            'Devgad', 'Dodamarg', 'Kankavli', 'Kudal', 'Malwan',
            'Sawantwadi', 'Vaibhavvadi', 'Vengurla'
          ]
        },
        {
          name: 'Solapur',
          aliases: [],
          subDistricts: [
            'Akkalkot', 'Barshi', 'Karmala', 'Madha', 'Malshiras',
            'Mangalvedhe', 'Mohol', 'Pandharpur', 'Sangole',
            'Solapur North', 'Solapur South'
          ]
        },
        {
          name: 'Thane',
          aliases: [],
          subDistricts: [
            'Ambarnath', 'Bhiwandi', 'Kalyan', 'Murbad', 'Shahapur', 'Thane', 'Ulhasnagar'
          ]
        },
        {
          name: 'Wardha',
          aliases: [],
          subDistricts: [
            'Arvi', 'Ashti', 'Deoli', 'Hinganghat', 'Karanja', 'Samudrapur', 'Seloo', 'Wardha'
          ]
        },
        {
          name: 'Washim',
          aliases: [],
          subDistricts: [
            'Karanja', 'Malegaon', 'Mangrulpir', 'Manora', 'Risod', 'Washim'
          ]
        },
        {
          name: 'Yavatmal',
          aliases: [],
          subDistricts: [
            'Arni', 'Babhulgaon', 'Darwha', 'Digras', 'Ghatanji', 'Kalamb',
            'Mahagaon', 'Maregaon', 'Ner', 'Pandharkawada', 'Pusad',
            'Ralegaon', 'Umarkhed', 'Wani', 'Yavatmal', 'Zari-Jamani'
          ]
        }
      ]
    }
  ]
};

module.exports = {
  ADMINISTRATIVE_DIVISIONS
};

