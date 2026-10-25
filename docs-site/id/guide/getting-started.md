---
title: Memulai
description: Instal Deepsand, buat proyek pertama Anda, dan jalankan kotak pasirnya.
---

# Memulai

Deepsand membantu Anda bekerja dengan asisten pengkodean AI pada proyek nyata tanpa memberikan asisten tersebut akses ke seluruh komputer Anda. Anda tidak perlu memahami Docker atau baris perintah untuk menggunakan alur dasar.

Jika ingin gambaran yang lebih besar terlebih dahulu, baca [Apa itu Deepsand?](./what-is-deepsand).

## Persyaratan

- Docker Desktop di Windows atau macOS, atau Docker Engine di Linux.
- Komputer Windows, macOS atau Linux. [halaman unduhan](../download) mendeteksi sistem dan mencantumkan penginstal yang cocok.
- Tidak diperlukan instalasi Node.js atau Rust kecuali Anda membuat Deepsand dari sumber.

Docker Desktop harus dijalankan sebelum Deepsand dapat memulai sandbox. Jika daemon masih berjalan, strip status menyatakan demikian dan menawarkan untuk memeriksa lagi. Docker Desktop juga dapat berjalan tetapi tidak responsif; jika Deepsand mengatakan daemon tidak menjawab, restart Docker Desktop. Ketika Deepsand mendeteksi Docker Desktop, ini menunjukkan kontrol **Mulai ulang Docker Desktop…**. Lihat [apa yang harus dilakukan jika Docker Desktop tidak berjalan atau berhenti merespons](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Memasang

Buka [Halaman unduhan Deepsand](../download). Ini mendeteksi sistem operasi Anda dan mencantumkan penginstal Windows, macOS dan Linux terbaru dari rilis GitHub saat ini. Pilih paket untuk komputer Anda, instal, lalu mulai Deepsand.

Jika Anda mengembangkan Deepsand sendiri, repositori README memiliki perintah source-build dan hot-reload.

## Jalankan pertama

Anda tidak perlu menginstal atau mengkonfigurasi DeepCode sebelum menggunakan Deepsand. Deepsand menjalankan DeepCode di dalam sandbox dan dilengkapi dengan default yang masuk akal untuk model dan titik akhir.

Satu hal yang Anda perlukan adalah kunci model API. Bagian selanjutnya menjelaskan cara mendapatkan kunci DeepSeek, atau Anda dapat menggunakan kunci dari penyedia lain. Simpan di **Pengaturan → tombol API**.

Jika Anda sudah menggunakan DeepCode CLI di komputer ini, Deepsand dapat mewarisi model, URL dasar, dan kunci dari konfigurasi DeepCode yang ada. Sebuah proyek juga dapat mengganti kredensial tersebut dalam pengaturannya sendiri.

## Dapatkan kunci API

Deepsand memerlukan kunci API dari penyedia model sebelum asisten dapat berjalan.

- **Jika Anda tidak memilikinya:** ikuti [Dapatkan kunci DeepSeek API](./deepseek-api). Ini berjalan melalui pembuatan akun, menambahkan kredit, membuat kunci dan kembali ke Deepsand.
- **Jika Anda sudah memilikinya:** buka **Pengaturan**, tempelkan ke kolom **Kunci API** dan pilih **Simpan kunci**.
- **Jika Anda menginginkan kunci khusus proyek:** buka pengaturan proyek itu dan masukkan di sana.

Kunci seluruh aplikasi disimpan di keystore sistem operasi Anda, bukan di file status Deepsand. Jendela hanya menampilkan empat karakter terakhir setelah disimpan.

## Buat proyek

1. Pilih **Proyek baru** di bar samping.
2. Beri nama proyek tersebut.
3. Pilih direktori kerja.
4. Buat proyek.

Direktori kerja menjadi `/workspace` di dalam kotak pasir. Deepsand menolak jalur seperti root sistem file, direktori home Anda, penyimpanan kredensial, dan direktori datanya sendiri.

## Pilih model

Gunakan **model lampu kilat** untuk sebagian besar tugas. Deepsand defaultnya adalah `deepseek-v4-flash`, yang merupakan pilihan lebih murah untuk pengkodean, penjelasan, dan pengeditan sehari-hari. Beralih ke `deepseek-v4-pro` hanya ketika flash jelas-jelas kesulitan mengerjakan suatu tugas; model pro lebih mahal untuk dijalankan.

Anda dapat mengubah model di **Pengaturan**, dari header proyek, atau dengan `/model` di terminal DeepCode.

## Pilih tingkat berpikir

Penggeser berpikir berada di sebelah pemilih model di header proyek. Ini mengontrol seberapa banyak alasan yang dilakukan model sebelum menjawab.

- **Mati:** tanpa berpikir. Tercepat, tapi paling tidak hati-hati.
- **Cepat:** sedikit berpikir, untuk pengeditan kecil yang ditentukan dengan baik.
- **Seimbang:** berpikir moderat dan berhenti di tengah. Ini adalah standar yang masuk akal untuk pekerjaan nyata.
- **Dalam:** penalaran maksimal. Paling lambat dan paling mahal.
- **Bawaan:** tunduk pada host `settings.json`; jika tidak tertulis apa pun, DeepCode kembali ke Seimbang.

Pertahankan penggeser pada **Seimbang** untuk sebagian besar tugas. Ini memberikan hasil yang baik tanpa membayar alasan paling lambat dan paling mahal pada setiap permintaan. Gunakan **Dalam** hanya untuk soal yang benar-benar sulit, dan **Mati** atau **Cepat** untuk pengeditan kecil dan dapat diprediksi.

## Jalankan sebuah proyek

1. Pilih proyek.
2. Tekan **Berlari**.
3. Jika gambar tidak ada, Deepsand akan membuatnya terlebih dahulu dan menampilkan output build di tab Aktivitas.
4. DeepCode CLI dimulai di dalam wadah dan muncul di terminal.

Menghentikan kotak pasir akan mengakhiri wadah. Memulainya kembali akan melanjutkan sesi DeepCode sebelumnya jika ada.

## Menggunakan terminal DeepCode

Tab **Terminal** adalah sesi DeepCode CLI langsung. Ketik permintaan dan tekan **Memasuki**, atau gunakan perintah garis miring untuk mengontrol sesi. `/new` memulai percakapan baru, `/resume` melanjutkan percakapan sebelumnya, `/model` mengubah model, dan `/` membuka menu perintah.

Baca [Menggunakan terminal DeepCode](./deepcode-terminal) untuk perintah utama, pintasan keyboard, dan langkah pemulihan.

## Menjawab permintaan izin

Ketika DeepCode memerlukan direktori, tujuan jaringan, alat, atau sumber daya lainnya, Deepsand menjeda kotak pasir dan menampilkan permintaan.

- **Berikan akses** mengizinkan permintaan dan melanjutkan sesi.
- **Tidak sekarang** menolaknya kali ini; model mungkin bertanya lagi nanti.
- **Jangan bertanya lagi** menolaknya, dan Deepsand kemudian menolak jalur tersebut (dan semua yang ada di bawahnya) atau host itu (dan subdomainnya) itu sendiri, tidak hanya dengan kata-kata. Setiap blok tercantum dalam Izin, tempat Anda dapat mengangkatnya kembali.
- Hibah direktori membuat ulang kontainer dengan mount baru terpasang.

Baca [Cara kerja kotak pasir](./security) sebelum memberikan akses ke direktori yang berisi file sensitif.

## Di mana menemukan sesuatu

| Daerah | Apa yang ditunjukkannya |
| --- | --- |
| Terminal | Sesi DeepCode langsung di dalam kotak pasir. |
| Izin | Direktori bersama, daftar jaringan yang diizinkan, dan jejak audit. |
| Alat | Alat dimasukkan ke dalam gambar proyek, mengelompokkan Kemampuan, Bahasa, Manajer paket, Utilitas, Rekayasa Terbalik. Tidak ada yang aktif secara default, dan mengubah pilihan akan membangun kembali gambar. |
| Rahasia | Nilai terenkripsi dimasukkan sebagai variabel lingkungan di awal. |
| Aktivitas | Argumen `docker run` yang tepat, log build, dan upaya jalan keluar yang diblokir. |

## Langkah selanjutnya

- [Cara kerja kotak pasir](./security)
- [Pertanyaan yang sering diajukan](./faq)
