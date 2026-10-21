---
title: Cara kerja kotak pasir
description: >-
  Apa yang diberlakukan Deepsand, apa yang Anda putuskan, dan apa yang tidak bisa dijangkau oleh
  sandbox.
---

# Cara kerja kotak pasir

Sederhananya: asisten dapat bekerja di proyek yang Anda pilih dan di folder yang Anda setujui, dan tidak di tempat lain di komputer Anda.

Janji Deepsand sempit dan dapat diuji: kotak pasir dapat menjangkau direktori proyek dan direktori yang Anda berikan secara eksplisit, dan tidak lebih.

## Batasnya

Kontainer tidak memiliki tampilan sistem file host selain dari pengikatan yang dipilih Deepsand. Jalur host lain tidak ada di dalam namespace pemasangan kontainer, jadi tidak ada file host yang bisa dijadikan tujuan escape.

Segala sesuatu yang dijelaskan di sini adalah pertahanan mendalam di atas batas tersebut.

## Apa yang diberlakukan

- Hanya ruang kerja dan hibah eksplisit yang dipasang dari host.
- Spool respons dan direktori status dipasang hanya-baca.
- Soket runtime container ditolak berdasarkan namanya.
- Sistem file root kontainer bersifat hanya baca, dengan sistem file sementara berukuran untuk `/tmp` dan `/run`.
- Tautan simbolik diselesaikan sebelum jalur diperiksa, sehingga tautan tidak dapat menyamarkan target terlarang.
- Hak istimewa dihilangkan sebelum DeepCode dijalankan, dan `no-new-privileges` mencegah hak istimewa tersebut diperoleh kembali.

## Mode jaringan

| Modus | Apa yang diizinkan |
| --- | --- |
| Tidak ada | Hanya titik akhir model yang melalui proksi Deepsand. |
| Diizinkan | Titik akhir model, proksi, dan host atau alamat di daftar yang diizinkan. |
| Internet | Akses internet, dengan rentang lokal dan pribadi diblokir di dalam wadah. |
| Penuh | Akses internet tanpa blok jaringan lokal. Gunakan hanya ketika kotak pasir benar-benar membutuhkan jaringan lokal Anda. |

Nama host yang diizinkan melewati proksi, yang menyelesaikan nama itu sendiri dan menolak hasilnya di ruang alamat pribadi. Alamat yang diizinkan diizinkan secara langsung berdasarkan aturan penampung, karena klien database atau program non-HTTP lainnya tidak dapat menggunakan proksi. Port yang disebutkan dalam entri juga dipublikasikan pada loopback host, tidak pernah pada setiap antarmuka.

## Apa yang Anda putuskan

Deepsand tidak pernah memberikan akses secara otomatis. Permintaan sampai kepada Anda dengan jalur, host, alat, atau sumber daya yang diminta, dan kotak pasir tetap dijeda hingga Anda memutuskan.

Permintaan untuk sesuatu yang sudah dimiliki kotak pasir ditolak dengan penjelasan, karena izin otomatis berarti persetujuan yang tidak pernah Anda berikan. Segala sesuatu yang ambigu sampai kepada Anda.

## Apa yang tidak dilindunginya

- Penyedia model dapat melihat konten yang Anda kirim ke sana.
- File yang Anda tempatkan di ruang kerja terlihat di kotak pasir dan dapat diubah atau dihapus.
- Alat atau instruksi model yang formatnya salah masih dapat meminta akses. Keputusan tetap di tangan Anda.
- Docker sendiri berada di luar batas. Selalu perbarui Docker Desktop dan sistem operasi host.

## Baca selengkapnya

Model keamanan penuh, termasuk pengujian yang menegaskan setiap properti, ada di [dokumen/SECURITY.md](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md).

Arsitekturnya dijelaskan di [dokumen/ARSITEKTUR.md](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md).
