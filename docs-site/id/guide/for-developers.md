---
title: Di bawah tenda
description: Arsitektur, isolasi, aliran izin, jaringan, dan alat baris perintah di belakang Deepsand.
---

# Di bawah tenda

Halaman ini diperuntukkan bagi pengembang yang menginginkan bentuk teknis sistem. Jika Anda mencari penjelasan dalam bahasa sederhana, mulailah dengan [Apa itu Deepsand?](./what-is-deepsand).

## Arsitektur

Deepsand adalah aplikasi desktop Tauri dengan tiga lapisan utama:

- **Jendela** adalah antarmuka SolidJS. Itu membuat status dan mengirimkan maksud; itu tidak memutuskan kebijakan.
- **Lapisan Tauri** memaparkan perintah desktop dan menerjemahkan permukaan perintah yang sama ke server HTTP loopback untuk klien jarak jauh.
- **`deepsand-core`** memiliki aturan. Validasi jalur, paket `docker run`, broker izin, proksi jalan keluar, penyimpanan rahasia terenkripsi, dan penyimpanan negara semuanya ada di sana.

Aplikasi desktop dan driver baris perintah `deepsandctl` menggunakan inti yang sama, sehingga keduanya tidak dapat terpisah dalam keputusan keamanan.

## Satu proyek, satu kontainer

Setiap proyek mendapatkan wadah Docker dan volume statusnya sendiri. Direktori proyek dipasang di `/workspace`; direktori host lain memerlukan hibah eksplisit.

`policy::plan_run` membangun argv `docker run` lengkap di satu tempat. Tab Aktivitas menunjukkan rencana persisnya, termasuk pemasangan, kemampuan, mode jaringan, dan jalur hanya-baca.

Wadahnya sengaja dibatasi:

- Sistem file root bersifat read-only, dengan ukuran tmpfs yang dipasang untuk `/tmp` dan `/run`.
- Spool respons dan direktori status dipasang hanya-baca.
- Soket runtime container ditolak berdasarkan namanya.
- Kemampuan dihilangkan sebelum DeepCode dijalankan, dan `no-new-privileges` disetel.
- Soket waktu proses kontainer dan dudukan terlarang lainnya gagal ditutup daripada menghasilkan rencana yang lebih lemah.

## Izin

Sandbox dapat meminta akses lebih banyak, namun tidak dapat memberikannya. Permintaan izin ditulis ke spul; broker tuan rumah memvalidasinya dan menjeda container. Operator melihat permintaan tersebut dan memutuskan.

Menyetujui permintaan direktori akan membuat ulang kontainer dengan pengikatan pengikatan baru dan melanjutkan sesi. Penolakan adalah salah satu dari dua jawaban, dan model diberi tahu yang mana: **Jangan bertanya lagi** sudah final, sedangkan **Tidak sekarang** menolak kali ini dan mengatakan bahwa model mungkin akan bertanya lagi nanti. Penolakan terakhir disimpan di proyek dan diterapkan oleh host: tidak ada mount yang dibuat untuk jalur atau apa pun di bawahnya, dan host yang ditolak menjadi aturan penolakan yang mencakup subdomainnya. Pemblokiran tercantum dalam Izin dan dapat dicabut di sana, karena keputusan tanpa jalan kembali adalah jebakan, bukan pilihan.

Permintaan untuk sesuatu yang sudah dimiliki sandbox ditolak dengan penjelasan. Tidak ada jalur persetujuan otomatis, karena persetujuan diam-diam merupakan persetujuan yang tidak pernah diberikan oleh operator.

## Jaringan

Kebijakan jaringan memiliki empat mode:

| Modus | Perilaku |
| --- | --- |
| `none` | Hanya titik akhir model yang melalui proksi jalan keluar Deepsand. |
| `allowlisted` | Titik akhir model, proksi, dan host bernama, alamat, dan port. |
| `internet` | Akses internet, dengan rentang lokal dan pribadi diblokir di dalam wadah. |
| `full` | Akses internet tanpa blok jaringan lokal. |

Entri nama host diselesaikan oleh proxy, yang menolak hasil pribadi, loopback, link-local, dan hasil yang dicadangkan. Entri alamat diterapkan langsung oleh kontainer, yang memungkinkan klien database atau program non-HTTP lainnya terhubung. Port bernama dipublikasikan pada loopback host saja.

## Rahasia dan pembaruan

Rahasia dienkripsi saat disimpan dengan kunci yang dipegang oleh keystore sistem operasi. Nilai tersebut diteruskan ke kontainer melalui file lingkungan, tidak pernah sebagai nilai baris perintah, dan hanya dimasukkan saat kotak pasir dimulai.

Versi rilis memverifikasi pembaruan yang ditandatangani sebelum menginstalnya. Kunci penandatanganan tidak pernah disimpan di repositori.

## Baris perintah

`deepsandctl` menyediakan permukaan tanpa kepala:

```bash
deepsandctl doctor
deepsandctl plan <project> --offline
deepsandctl run <project>
deepsandctl watch <project>
deepsandctl requests <project>
deepsandctl network <project> <mode>
```

`plan --offline` mencetak argv `docker run` yang tepat tanpa memulai container, yang berguna untuk meninjau kebijakan yang diubah.

## Baca selengkapnya

- [Model keamanan penuh](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md)
- [Catatan arsitektur](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md)
- [Cara kerja kotak pasir](./security)
