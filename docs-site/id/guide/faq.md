---
title: Pertanyaan yang sering diajukan
description: Jawaban singkat tentang proyek, izin, data, dan pembaruan.
---

# Pertanyaan yang sering diajukan

## Apakah DeepCode melihat direktori home saya?

Tidak. Sandbox melihat direktori proyek di `/workspace` dan direktori yang Anda berikan secara eksplisit. Sistem file host lainnya tidak dipasang.

## Apa yang terjadi jika saya menyetujui permintaan direktori?

Deepsand menambahkan direktori sebagai hibah, membuat ulang kontainer dengan mount baru terpasang, dan melanjutkan sesi DeepCode. Sandbox yang sedang berjalan tidak dapat memperoleh pengikatan tanpa dibuat ulang.

## Di mana percakapan saya disimpan?

Riwayat percakapan, sesi, lampiran, dan keterampilan yang dihasilkan ada dalam volume Docker per proyek. Folder proyek pada disk hanya berisi kode dan file Anda.

Menghapus proyek dari Deepsand tidak menghapus volume tersebut. Menghapus data DeepCode proyek akan menghilangkan volume namun membiarkan folder proyek tidak tersentuh.

## Di mana kunci dan rahasia API disimpan?

Rahasia dienkripsi saat disimpan dengan kunci yang dipegang oleh keystore sistem operasi, dan dimasukkan ke dalam kotak pasir sebagai variabel lingkungan hanya ketika rahasia dimulai. Antarmuka menunjukkan nama dan panjangnya, bukan nilai yang disimpan.

Kredensial juga dapat diwarisi dari konfigurasi host DeepCode Anda. Mereka tidak disalin ke folder proyek.

## Bisakah setiap proyek menggunakan model yang berbeda?

Ya. Sebuah proyek dapat mewarisi konfigurasi host atau mengganti model, URL dasar, dan kredensial dalam pengaturannya sendiri. Pemilih header juga dapat memilih model untuk proyek tersebut; **Tunda Konfigurasi** berarti proyek tidak menyematkannya.

## Model mana yang harus saya gunakan untuk menekan biaya?

Gunakan model flash untuk sebagian besar tugas. Deepsand defaultnya adalah `deepseek-v4-flash`, yang merupakan pilihan lebih murah untuk pengkodean, penjelasan, dan pengeditan sehari-hari. Cadangan `deepseek-v4-pro` untuk pekerjaan di mana flash jelas-jelas bermasalah atau Anda memerlukan kemampuan ekstra, karena model pro lebih mahal untuk dijalankan.

Ganti model dari header proyek atau dengan `/model` di terminal DeepCode. Jika Anda mencoba Deepsand untuk pertama kalinya, mulailah dengan flash dan hanya beralih ke pro ketika Anda memiliki tugas yang memerlukannya.

## Apa yang dilakukan penggeser berpikir?

Penggeser berpikir berada di sebelah pemilih model di header proyek. Ini mengontrol seberapa banyak alasan yang dilakukan model sebelum memberikan jawaban.

| Hentikan | Artinya |
| --- | --- |
| **Mati** | Jangan berpikir sebelum menjawab. Tercepat, tapi paling tidak hati-hati. |
| **Cepat** | Sedikit berpikir, untuk pengeditan kecil yang ditentukan dengan baik. |
| **Seimbang** | Pemikiran moderat. Perhentian tengah dan standar yang masuk akal untuk pekerjaan nyata. |
| **Dalam** | Berpikirlah sekeras yang bisa dilakukan model. Paling lambat dan paling mahal. |
| **Bawaan** | Tunduk pada host `settings.json`; jika tidak tertulis apa pun, DeepCode kembali ke Seimbang. |

Pertahankan penggeser pada **Seimbang** untuk sebagian besar tugas. Ini adalah pengaturan tengah, dan memberikan hasil yang baik tanpa harus membayar alasan paling lambat dan paling mahal pada setiap permintaan. Pindah ke **Dalam** hanya untuk soal yang benar-benar sulit, dan gunakan **Mati** atau **Cepat** untuk pengeditan kecil dan dapat diprediksi.

## Apakah Deepsand hanya berfungsi dengan DeepSeek?

Tidak. DeepSeek adalah default karena merupakan model dan titik akhir yang disertakan dengan Deepsand, tetapi Deepsand mengonfigurasi DeepCode CLI dengan nama model, URL dasar, dan kunci API. Anda dapat mengarahkannya ke penyedia lain yang mengekspos API yang dapat dipanggil oleh CLI, biasanya merupakan titik akhir yang kompatibel dengan OpenAI.

Tetapkan URL dan model dasar penyedia di **Pengaturan**, atau dalam kredensial proyek itu sendiri, dan simpan kunci API penyedia tersebut di tempat yang sama. Kebijakan jaringan sandbox juga harus mengizinkan titik akhir penyedia.

## Bagaimana jika Docker Desktop tidak berjalan atau berhenti merespons?

Deepsand tidak dapat memulai sandbox tanpa mesin Docker. Jika Docker Desktop tidak berjalan, hidupkan dan tunggu hingga mesin selesai dihidupkan. Deepsand memeriksa ulang kapan jendela kembali fokus, dan strip status menawarkan percobaan ulang.

Terkadang Docker Desktop masih berjalan tetapi mesinnya berhenti merespons. Memulai ulang Deepsand tidak memperbaikinya; Docker Desktop sendiri perlu di-restart.

- **Gunakan kontrol dalam aplikasi saat muncul.** Jika Deepsand mendeteksi Docker Desktop, **Mulai ulang Docker Desktop…** ditampilkan di strip status atau peringatan terminal. Kontrol tersebut memulai ulang mesin Docker, termasuk proses WSL yang digunakan pada Windows, dan menunggu hingga kontainer dapat dimulai kembali.
- **Windows:** klik kanan paus Docker di area notifikasi dan pilih **Mulai ulang**. Jika opsi tersebut tidak ada, buka Docker Desktop, pilih **Memecahkan masalah**, lalu **Mulai ulang Docker Desktop**.
- **macOS:** klik paus Docker di bilah menu dan pilih **Mulai ulang**.
- **Linux:** buka menu Docker Desktop, pilih **Memecahkan masalah**, lalu **Mulai ulang Docker Desktop**. Jika Anda menggunakan Docker Engine dan bukan Docker Desktop, mulai ulang layanannya, misalnya `sudo systemctl restart docker`.

Memulai ulang Docker Desktop mengakhiri setiap kontainer di mesin, termasuk kontainer yang tidak terkait dengan Deepsand. Deepsand menawarkan restart tetapi tidak melakukannya secara otomatis. Lihat [Dokumentasi pemecahan masalah Docker](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) untuk menu khusus platform.

## Bisakah saya menggunakan Deepsand tanpa akses internet?

Model ini membutuhkan titik akhirnya. Dengan mode jaringan `none`, hanya titik akhir tersebut yang dapat dijangkau melalui proksi Deepsand. Penginstalan paket dan akses jaringan lainnya akan gagal kecuali Anda mengizinkan host yang mereka perlukan.

## Bagaimana cara memperbarui Deepsand?

Buka **Pengaturan**, lalu **Pembaruan**, dan periksa versi yang lebih baru. Rilis build mengunduh pembaruan yang ditandatangani dan memulai ulang aplikasi setelah menginstalnya. Menginstal pembaruan akan menghentikan pengoperasian kotak pasir.

## Apakah ada antarmuka baris perintah?

Ya. `deepsandctl` menyediakan perintah tanpa kepala seperti `doctor`, `plan`, `run`, `watch`, `requests` dan `network`. Aplikasi desktop dan CLI berbagi kode kebijakan yang sama di `deepsand-core`.

## Bagaimana cara melaporkan masalah keamanan?

Jangan membuka isu publik untuk masalah keamanan. Hubungi pengelola secara pribadi melalui saluran pelaporan keamanan repositori dan sertakan detail yang cukup untuk mereproduksi masalah.
