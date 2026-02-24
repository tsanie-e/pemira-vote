export type CandidateProfile = {
  name: string;
  className: string;
  popupPhoto: string;
  visi: string;
  misi: string[];
  programKerja: string[];
};

export const CANDIDATE_PROFILES: Record<number, CandidateProfile> = {
  1: {
    name: "Nayla Almaqhfira R.",
    className: "XI SIJA 2",
    popupPhoto: "/assets/p1-popup.png",
    visi:
      "Mewujudkan murid SMKN 1 Cibinong yang berkarakter dan berprestasi dengan OSIS sebagai koordinator kegiatan sekolah yang aktif dan bertanggung jawab.",
    misi: [
      "Mendorong komunikasi yang sehat antara OSIS, MPPK, guru, serta civitas sekolah sebagai dasar terciptanya kerjasama yang baik.",
      "Menindaklanjuti aspirasi yang disalurkan MPPK menjadi program kerja yang kreatif, edukatif, serta sesuai dengan peraturan sekolah.",
      "Menguatkan kerja sama internal OSIS dan MPPK agar organisasi berjalan solid, terarah, dan bertanggung jawab.",
      "Melakukan kegiatan positif yang menumbuhkan budaya disiplin di lingkungan sekolah.",
    ],
    programKerja: [
      "Forum Ekstrakurikuler: menyediakan wadah diskusi resmi bagi perwakilan ekstrakurikuler di SMKN 1 Cibinong untuk menyampaikan saran dan kritik terkait kegiatan ekstrakurikuler kepada OSIS guna meningkatkan kualitas, koordinasi, dan kerja sama antar ekstrakurikuler.",
      "Koordinasi Rutin OSIS & MPPK (KROM): mengadakan pertemuan rutin antara pengurus OSIS dan MPPK untuk menindaklanjuti aspirasi, menyamakan arah kerja, serta membahas perkembangan kegiatan.",
      "Osis Creative Media (OCM): mengelola media kreatif OSIS seperti youtube dan media sosial lainnya sebagai sarana informasi, dokumentasi kegiatan, serta edukasi yang positif.",
      "Kompetisi Millenium Sport: menyelenggarakan kegiatan perlombaan olahraga sebagai wadah penyaluran minat dan bakat murid SMKN 1 Cibinong yang menjunjung tinggi sportivitas, kebersamaan, dan tata tertib sekolah.",
    ],
  },
  2: {
    name: "Daffadin Nabil S.",
    className: "XI TKR 1",
    popupPhoto: "/assets/p2-popup.png",
    visi:
      "Menciptakan OSIS SMKN 1 Cibinong sebagai organisasi yang solid, inspiratif, dan berperan aktif dalam membantu membentuk siswa SMK yang kompeten, disiplin, dan siap dalam menghadapi dunia kerja.",
    misi: [
      "Meningkatkan kedisiplinan, tanggung jawab, dan profesional seluruh murid.",
      "Mengoptimalkan peran OSIS sebagai penggerak kegiatan positif di sekolah.",
      "Membentuk jiwa kepemimpinan dan kemandirian pada setiap anggota.",
      "Menciptakan program kerja yang kreatif, relative, dan selaras dengan perkembangan teknologi.",
      "Menjadikan OSIS sebagai organisasi yang solid, harmonis, dan penuh rasa kekeluargaan.",
    ],
    programKerja: [
      "Student Exhibition: kegiatan yang mewadahi kreativitas para pelajar di bidang vokasi untuk memamerkan hasil karya-karyanya dengan tujuan menunjukkan kreativitas para pelajar serta sebagai media promosi sekolah.",
      "Pekan Olahraga Antar Jurusan Modern (PORJAM): minggu di mana diadakannya kegiatan turnamen olahraga antar jurusan untuk mengembangkan jiwa sportivitas dan kerja sama tim yang baik.",
      "Evaluasi dan Optimalisasi OSIS: melakukan evaluasi terhadap kegiatan dan kinerja OSIS guna meningkatkan efektivitas dan kualitas organisasi.",
      "Pojok Vokasi (POV): podcast yang mengundang motivator untuk berbagi ilmu pengetahuan dan pengalaman.",
    ],
  },
  3: {
    name: "Naila Zhafira I.",
    className: "XI DKV 2",
    popupPhoto: "/assets/p3-popup.png",
    visi:
      "Mengembangkan OSIS SMK Negeri 1 Cibinong sebagai organisasi siswa yang berintegritas, disiplin, kreatif, peduli lingkungan, dan berprestasi yang siap bersaing di tingkat nasional.",
    misi: [
      "Membentuk kedisiplinan dan tanggung jawab siswa melalui kegiatan organisasi yang terstruktur.",
      "Menciptakan sekolah yang bersih dan hijau melalui aksi pelestarian yang nyata.",
      "Mendorong pengembangan kreativitas, inovasi, serta bakat dan minat siswa melalui kegiatan seni, budaya, dan program kreatif yang berdampak positif dan berprestasi.",
    ],
    programKerja: [
      "Sisip Karakter: program penanaman nilai karakter yang dilaksanakan dengan cara menyisipkan materi pendidikan karakter ke dalam kegiatan sekolah yang sudah ada, khususnya MPLS dan LDKS.",
      "GEMPITA (Gerakan Memperhatikan Kebersihan Antar Jurusan): kompetisi kebersihan lab/bengkel antar jurusan dengan sistem penilaian rutin dan evaluasi berkala guna menjaga kenyamanan belajar.",
      "SEMEKAR (Semarak Karya Siswa SMK): kegiatan kreativitas akhir semester yang menampilkan produk unggulan tiap jurusan, bazar, dan pentas seni sebagai wadah apresiasi bakat siswa.",
    ],
  },
};

export const getCandidateProfile = (id: number, fallbackName: string) => {
  const profile = CANDIDATE_PROFILES[id];
  return {
    name: profile?.name ?? fallbackName,
    className: profile?.className ?? "",
  };
};

export const getCandidateDetail = (
  id: number,
  fallbackName: string,
  fallbackClassName = ""
) => {
  const profile = CANDIDATE_PROFILES[id];
  return {
    name: profile?.name ?? fallbackName,
    className: profile?.className ?? fallbackClassName,
    popupPhoto: profile?.popupPhoto ?? "/assets/paslon1.jpeg",
    visi: profile?.visi ?? "",
    misi: profile?.misi ?? [],
    programKerja: profile?.programKerja ?? [],
  };
};
