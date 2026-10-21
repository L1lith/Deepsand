---
title: Dapatkan kunci DeepSeek API
description: Daftar ke platform DeepSeek API, tambahkan kredit, buat kunci, dan simpan dengan aman di Deepsand.
---

# Dapatkan kunci DeepSeek API

Deepsand memerlukan penyedia model untuk memberi daya pada asisten. Konfigurasi default menggunakan DeepSeek. Halaman ini menjelaskan cara membuat akun, menambahkan kredit, membuat kunci API, dan menyimpannya di Deepsand.

Jika Anda sudah memiliki kunci API dari penyedia lain, lewati ke [Gunakan kunci yang sudah Anda miliki](#use-a-key-you-already-have).

## Sebelum Anda mulai

Anda akan membutuhkan:

- Alamat email atau akun masuk yang didukung.
- Metode pembayaran kredit API.
- Beberapa menit untuk membuat kunci dan menempelkannya ke Deepsand.

DeepSeek API ditagih secara terpisah dari situs web obrolan DeepSeek dan aplikasi seluler. Menambahkan pulsa pada platform API inilah yang memungkinkan asisten membuat permintaan.

## 1. Buat akun DeepSeek

1. Buka [Platform DeepSeek API](https://platform.deepseek.com/).
2. Pilih **Mendaftar** atau **Masuk**.
3. Buat akun dengan alamat email Anda, atau gunakan salah satu opsi masuk yang didukung.
4. Verifikasi alamat email atau nomor telepon Anda jika platform meminta Anda melakukannya.

## 2. Tambahkan kredit

1. Masuk ke platform API.
2. Buka bagian penagihan atau isi ulang di dashboard.
3. Tambahkan jumlah kredit yang ingin Anda gunakan.
4. Selesaikan pembayaran.

Penggunaan API dipotong dari saldo ini. Platform ini menunjukkan saldo, penggunaan, dan harga saat ini. Mulailah dengan jumlah kecil saat Anda mencoba Deepsand; Anda dapat menambahkan lebih banyak lagi nanti.

## 3. Buat kunci API

1. Buka bagian **Kunci API** pada platform.
2. Pilih **Buat kunci API baru** atau tombol setara.
3. Berikan kunci tersebut nama yang Anda kenali, seperti **Deepsand**.
4. Buat kunci dan segera salin.

Kuncinya biasanya hanya ditampilkan sekali. Perlakukan itu seperti kata sandi: siapa pun yang memilikinya dapat membelanjakan kredit di akun Anda.

## 4. Simpan kunci di Deepsand

1. Buka Deepsand.
2. Buka **Pengaturan**.
3. Temukan bidang **Kunci API** di bawah kredensial default.
4. Tempelkan kuncinya.
5. Pilih **Simpan kunci**.

Deepsand menyimpan kunci di keystore sistem operasi Anda, bukan di file pengaturannya. Jendela hanya menampilkan empat karakter terakhir setelah disimpan, sehingga Anda dapat mengonfirmasi adanya kunci tanpa memaparkannya lagi.

Kunci seluruh aplikasi digunakan ketika konfigurasi host DeepCode maupun proyek tidak menyediakan kuncinya sendiri. Kunci tingkat proyek masih diutamakan.

## Gunakan kunci yang sudah Anda miliki

Jika Anda sudah memiliki kunci API, Anda tidak perlu membuat akun DeepSeek.

- Untuk menggunakannya di setiap proyek, buka **Pengaturan**, masukkan kunci di kolom **Kunci API**, dan simpan.
- Untuk menggunakan titik akhir atau model yang berbeda, atur juga URL dan model dasar di **Pengaturan** atau dalam kredensial proyek itu sendiri.
- Untuk menyimpan kunci hanya untuk satu proyek, buka pengaturan proyek tersebut dan masukkan di sana.

Penyedia harus mengekspos API yang dapat dihubungi oleh DeepCode CLI. Jika Anda menggunakan penyedia non-DeepSeek, masukkan URL dasar dan nama modelnya, bukan default DeepSeek.

## Jika sesuatu tidak berhasil

- **Kuncinya ditolak:** membuat kunci baru di platform dan mengganti kunci yang disimpan.
- **Saldonya kosong:** menambahkan kredit ke akun API. Langganan obrolan tidak secara otomatis mendanai penggunaan API.
- **Asisten tidak dapat menghubungi penyedia:** memeriksa mode jaringan proyek dan daftar yang diizinkan. Titik akhir model harus dapat dijangkau.
- **Anda ingin menghapus kunci:** buka **Pengaturan** dan pilih **Hapus kunci**.

## Halaman terkait

- [Memulai](./getting-started)
- [Apa itu Deepsand?](./what-is-deepsand)
- [Cara kerja kotak pasir](./security)
