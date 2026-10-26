---
title: Menggunakan terminal DeepCode
description: >-
  Cara menggunakan DeepCode CLI di dalam Deepsand, perintah garis miring utamanya dan pintasan
  keyboard.
---

# Menggunakan terminal DeepCode

Deepsand menjalankan [DeepCode CLI](https://github.com/lessweb/deepcode-cli) di dalam kotak pasir. Tab **Terminal** adalah sesi DeepCode langsung: ketik permintaan dalam bahasa normal, atau gunakan salah satu perintah garis miring DeepCode untuk mengontrol sesi.

Anda tidak menginstal DeepCode di mesin Anda sendiri. Deepsand memulai CLI dalam wadah proyek, di mana ia dapat melihat `/workspace` dan direktori yang telah Anda bagikan.

Pelajari lebih lanjut di [Halaman beranda proyek DeepCode](https://deepcode.vegamo.cn/) atau di [Repositori DeepCode](https://github.com/lessweb/deepcode-cli).

## Mulai sesi

1. Pilih proyek di sidebar.
2. Tekan **Berlari**.
3. Tunggu hingga kotak pasir dimulai. Jika gambar tidak ada, Deepsand akan membuatnya terlebih dahulu dan menampilkan output build di **Aktivitas**.
4. Terminal DeepCode muncul ketika CLI siap.

Menghentikan kotak pasir akan mengakhiri wadah. Memulai proyek lagi akan melanjutkan percakapan DeepCode sebelumnya jika ada.

## Minta DeepCode untuk melakukan sesuatu

Ketik permintaan normal dan tekan **Memasuki**. Misalnya:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode dapat membaca dan mengedit file di ruang kerja, menjalankan perintah, dan menggunakan alat yang dipilih untuk proyek tersebut. Anda tetap memegang kendali: ketika memerlukan sesuatu di luar ruang kerja, Deepsand menghentikan sementara kotak pasir dan menanyakan Anda terlebih dahulu.

## Perintah garis miring utama

Perintah garis miring dimulai dengan `/`. Mengetik `/` sendiri akan membuka menu perintah.

| Perintah | Apa fungsinya |
| --- | --- |
| `/new` | Mulai percakapan baru |
| `/resume` | Pilih percakapan sebelumnya untuk melanjutkan |
| `/fork` | Cabangkan percakapan saat ini |
| `/continue` | Lanjutkan percakapan aktif, atau pilih salah satu untuk dilanjutkan |
| `/model` | Ganti model, cara berpikir dan upaya penalaran |
| `/raw` | Alihkan mode tampilan: Scrollback Normal, Ringan, atau Mentah |
| `/init` | Buat file `AGENTS.md` dengan instruksi proyek |
| `/skills` | Buat daftar keterampilan yang tersedia untuk DeepCode |
| `/mcp` | Tampilkan status server MCP dan alat yang tersedia |
| `/undo` | Kembalikan kode, percakapan atau keduanya ke poin sebelumnya |
| `/exit` | Keluar dari DeepCode |

Sebuah proyek mungkin sudah memiliki `AGENTS.md`; periksa sebelum menggunakan `/init` agar tidak mengganti petunjuk yang sudah ada.

## Pintasan keyboard

| Kunci | Aksi |
| --- | --- |
| `Enter` | Kirim perintah |
| `Shift+Enter` | Sisipkan baris baru |
| `Ctrl+J` | Sisipkan baris baru |
| `Esc` | Interupsi giliran model saat ini |
| `Ctrl+V` | Tempelkan gambar ketika model yang dipilih mendukung gambar |
| `Ctrl+D` dua kali | Keluar dari DeepCode |

Setelah menghentikan belokan dengan `Esc`, Anda dapat mengetikkan permintaan lain. Kotak pasir tidak dimulai ulang.

## Menjatuhkan file ke terminal

Seret file ke terminal dan jalurnya akan diketikkan untuk Anda.

- File di dalam folder proyek, atau di dalam direktori yang Anda bagikan dengan proyek, dirujuk ke tempat kotak pasir sudah melihatnya (`/workspace/...` atau `/grants/...`). Tidak ada yang disalin.
- File dari mana pun disalin ke `/tmp/deepsand-incoming` di dalam kotak pasir, dan Deepsand bertanya terlebih dahulu. Folder tersebut bukan bagian dari repositori mana pun, sehingga file yang dijatuhkan tidak dapat dimasukkan ke dalam commit, dan file tersebut akan hilang saat kotak pasir dibuat ulang. Dialog memiliki saklar **Jangan peringatkan aku lagi**, yang pengaturannya sama dengan **Pengaturan → Perilaku → Peringatkan sebelum membuang file dari luar proyek**.

## Tetap up to date

DeepCode CLI dipasang di dalam gambar kotak pasir, dan kotak pasir tidak dapat memperbarui dirinya sendiri. Sebelum setiap memulai, Deepsand menanyakan npm apa rilis terbaru dan, jika gambar memiliki versi yang lebih lama, buat ulang bagian gambar tersebut terlebih dahulu — sehingga terminal tidak pernah terbuka pada versi yang sudah meminta Anda untuk memperbarui. Jawabannya diingat selama seperempat jam, jadi ini adalah satu permintaan, bukan satu permintaan per proses, dan jika npm tidak dapat dijangkau, kotak pasir akan dimulai pada versi yang sudah dimilikinya.

## Sesi, model, dan pembatalan

- `/new` dimulai dengan percakapan yang bersih. File proyek tidak dihapus.
- `/resume` dan `/continue` membawa kembali percakapan sebelumnya.
- `/model` mengubah model, cara berpikir, dan upaya penalaran untuk sesi tersebut. Header proyek juga memiliki pemilih model dan penggeser pemikiran; **Seimbang** adalah titik tengah dan pengaturan yang direkomendasikan untuk sebagian besar pekerjaan.
- `/undo` memulihkan kode, percakapan atau keduanya ke titik sebelumnya. Ini adalah cara tercepat untuk mundur dari perubahan yang tidak Anda inginkan.

Riwayat percakapan berada di volume status Deepsand proyek, bukan di repositori Anda.

## Izin dan kotak pasir

Terminal ada di dalam container, sehingga ia melihat proyek di `/workspace` dan direktori yang Anda bagikan secara eksplisit, dan tidak ada yang lain di komputer Anda.

Ketika DeepCode meminta direktori lain, tujuan jaringan, alat atau sumber daya lainnya, Deepsand membekukan kotak pasir dan menampilkan dialog izin.

- **Berikan akses** menerapkan permintaan dan melanjutkan sesi.
- **Tidak sekarang** menolaknya kali ini; DeepCode mungkin bertanya lagi nanti.
- **Jangan bertanya lagi** menolaknya, dan Deepsand kemudian menolak jalur tersebut (dan semua yang ada di bawahnya) atau host itu (dan subdomainnya) itu sendiri, tidak hanya dengan kata-kata. Setiap blok tercantum dalam Izin, tempat Anda dapat mengangkatnya kembali.
- Menyetujui direktori akan membuat ulang kontainer dengan mount baru.

Baca [Cara kerja kotak pasir](./security) sebelum membagikan direktori yang berisi file sensitif.

## Jika terminal tidak mulai

- **Gambarnya hilang:** Deepsand membuatnya terlebih dahulu. Tonton **Aktivitas** untuk kemajuan pembangunan.
- **Docker Desktop tidak berjalan atau macet:** hidupkan dan tunggu hingga mesin selesai dihidupkan. Jika Docker Desktop berjalan tetapi mesinnya tidak menjawab, restart Docker Desktop. Gunakan kontrol **Mulai ulang Docker Desktop…** dalam aplikasi saat Deepsand menampilkannya. Jika tidak, pada Windows klik kanan paus Docker di area notifikasi dan pilih **Mulai ulang**; pada macOS gunakan ikon bilah menu Docker; pada Linux buka menu Docker Desktop **Memecahkan masalah**. Memulai ulang Docker Desktop mengakhiri setiap kontainer di mesin. Lihat [Pertanyaan Umum Docker](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **Kunci API hilang atau ditolak:** buka **Pengaturan** dan simpan kunci yang valid.
- **DeepCode keluar:** tekan **Berlari** lagi. Sesi sebelumnya dapat dilanjutkan dengan `/resume`.

## Halaman terkait

- [Memulai](./getting-started)
- [Dapatkan kunci DeepSeek API](./deepseek-api)
- [Cara kerja kotak pasir](./security)
- [Halaman beranda proyek DeepCode](https://deepcode.vegamo.cn/)
