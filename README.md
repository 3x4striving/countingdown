# Counting Down — Striving 3 INT & 4 2026 Gontor 3

Website hitung mundur rangkaian acara akhir tahun. Dibuka santri lewat HP,
acaranya dikelola panitia lewat halaman **Kelola Acara** tanpa menyentuh kode.

| Berkas | Isinya |
|---|---|
| `index.html` | Halaman countdown yang dilihat santri |
| `admin.html` | Panel kelola acara (khusus panitia) |
| `events.json` | **Satu-satunya** tempat data acara disimpan |
| `assets/` | Gaya, skrip, dan gambar branding |

---

## Bagian 1 — Menaikkan website ke internet (sekali saja)

### 1. Buat akun GitHub

Buka <https://github.com/signup>, daftar dengan email, lalu verifikasi lewat email
yang masuk. Gratis. Catat **username** yang dipilih — nanti dipakai sebagai alamat
website.

### 2. Buat repo baru

1. Setelah masuk, klik tanda **+** di pojok kanan atas → **New repository**
2. **Repository name**: `counting-down`
3. Pilih **Public** (wajib — GitHub Pages gratis hanya untuk repo publik)
4. Jangan centang apa pun di bagian "Initialize this repository"
5. Klik **Create repository**

### 3. Unggah berkas website

1. Di halaman repo yang baru dibuat, klik **uploading an existing file**
2. Buka folder `site/` di komputer, **blok seluruh isinya** (index.html, admin.html,
   events.json, folder assets, .nojekyll, README.md), lalu seret ke jendela GitHub

   > Yang diunggah adalah **isi** folder `site/`, bukan foldernya. Kalau nanti
   > alamat website jadi `…/counting-down/site/`, berarti foldernya ikut terbawa —
   > hapus lalu ulangi.

3. Tunggu sampai semua berkas selesai naik, lalu klik **Commit changes**

### 4. Nyalakan GitHub Pages

1. Di repo, klik tab **Settings**
2. Menu kiri → **Pages**
3. **Source**: pilih `Deploy from a branch`
4. **Branch**: pilih `main`, folder `/ (root)` → klik **Save**
5. Tunggu ±1 menit, lalu segarkan halaman itu. Akan muncul kotak hijau berisi alamat:

```
https://USERNAME-ANDA.github.io/counting-down/
```

Itulah alamat yang dibagikan ke santri. Halaman kelola acaranya:

```
https://USERNAME-ANDA.github.io/counting-down/admin.html
```

---

## Bagian 2 — Membuat token untuk halaman admin

Token adalah kunci yang mengizinkan halaman admin menyimpan perubahan ke repo.

1. Klik foto profil (kanan atas) → **Settings**
2. Menu kiri paling bawah → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Isi:
   - **Token name**: `counting-down admin`
   - **Expiration**: 1 tahun (catat tanggalnya, nanti perlu diperbarui)
   - **Repository access**: pilih **Only select repositories** → centang `counting-down`
   - **Permissions** → **Repository permissions** → cari **Contents** → ubah jadi
     **Read and write**
5. Klik **Generate token**
6. **Salin tokennya sekarang juga** — GitHub hanya menampilkannya satu kali.
   Kalau terlanjur tertutup, tinggal buat token baru.

Token ini hanya bisa menyentuh repo `counting-down` dan hanya bisa membaca/menulis
berkas. Ia tidak bisa menghapus repo dan tidak bisa menyentuh repo lain.

---

## Bagian 3 — Memakai halaman Kelola Acara

Buka `https://USERNAME-ANDA.github.io/counting-down/admin.html`

**Pertama kali di sebuah perangkat**, isi kotak *Sambungan ke GitHub*:

| Kotak | Isi |
|---|---|
| Pemilik (username) | username GitHub, mis. `labkomputerg3` |
| Nama repo | `counting-down` |
| Cabang | `main` |
| Token | tempel token dari Bagian 2 |

Centang **Ingat di perangkat ini** hanya kalau memakai laptop/HP pribadi, lalu klik
**Sambungkan & muat data**. Kalau muncul tulisan hijau "Tersambung ke …", berarti
sudah siap.

**Sehari-hari:**

1. Tambah acara: **+ Tambah acara**, isi tanggal dan nama (jam & keterangan opsional)
2. Ubah acara: ketik langsung di kotaknya
3. Hapus acara: tombol **Hapus** di baris itu
4. Lihat hasilnya di bagian **Pratinjau** di bawah
5. Klik **Simpan ke GitHub**

Urutan acara dirapikan sendiri menurut tanggal, jadi acara baru boleh ditambahkan
di baris paling bawah.

> **Perubahan tidak langsung tampil.** GitHub membangun ulang website dulu, jadi
> beri jeda sekitar 1 menit sebelum membuka halaman santri. Kalau masih versi lama,
> tekan Ctrl+F5 (di HP: tutup lalu buka lagi tabnya).

### Kalau tokennya bermasalah

Semua tombol tetap bisa dipakai tanpa token, kecuali **Simpan ke GitHub**. Jalan
darurat kalau token hilang/kedaluwarsa saat sedang buru-buru:

1. Sunting daftarnya seperti biasa → klik **Unduh events.json**
2. Buka repo di GitHub → klik berkas `events.json` → klik ikon pensil (Edit)
3. Blok seluruh isinya, tempel isi berkas yang tadi diunduh → **Commit changes**

Untuk mengganti token yang kedaluwarsa: buat token baru (Bagian 2), lalu di halaman
admin klik **Lupakan token**, tempel yang baru, klik **Sambungkan & muat data**.

### Catatan keamanan

- Alamat `admin.html` memang bisa dibuka siapa saja — tapi **tanpa token, tidak ada
  yang bisa disimpan**. Yang menjaga data adalah tokennya, bukan alamatnya.
- Jangan centang "Ingat di perangkat ini" di komputer bersama. Tanpa centang, token
  hilang sendiri begitu tab ditutup.
- Jangan menempel token ke chat, WhatsApp, atau berkas mana pun di repo.
- Kalau token telanjur tersebar: GitHub → Settings → Developer settings →
  Fine-grained tokens → pilih tokennya → **Revoke**, lalu buat yang baru.

---

## Menjalankan di komputer sendiri (opsional)

Berguna untuk mencoba tampilan sebelum diunggah. Butuh Python:

```powershell
cd site
python -m http.server 8080
```

Lalu buka <http://localhost:8080/>.

> Membuka `index.html` dengan dobel-klik juga bisa, tapi browser melarang
> pembacaan `events.json` lewat `file://`, jadi yang tampil adalah salinan cadangan
> yang tertanam di `assets/app.js` — bukan data terbaru.

**Menguji tampilan pada tanggal tertentu** tanpa mengubah jam komputer, tambahkan
`?tanggal=` di alamatnya:

```
http://localhost:8080/?tanggal=2026-10-12        → seolah-olah hari ini 12 Oktober
http://localhost:8080/?tanggal=2026-12-11        → seluruh acara sudah lewat
```

---

## Mengganti gambar branding

Gambar di `assets/img/` dihasilkan dari berkas sumber (`.png` dan `.jpg` besar di
folder induk) oleh skrip:

```powershell
python tools/optimasi_aset.py
```

Skrip itu memangkas kanvas kosong, mengecilkan ukuran, dan menyimpan versi WebP.
Berkas `.psd` dan gambar mentah **sengaja tidak diunggah** ke GitHub karena
ukurannya ratusan MB.

Kecuali `awan.webp`: berkas itu **tidak** dipangkas ke isi, karena posisi awan di
dalam kanvas 16:9-nya (kiri atas, kiri bawah, kanan bawah) itulah komposisinya.

### Aturan pakai ornamen emas

Acuannya ada di `referensi/Contoh penggunaan hias kiri dan kanan.jpg`: kedua pita
emas duduk di **sudut bawah** halaman, menempel tepi, **opacity penuh** — bukan
melayang samar di sisi atas. Awan dipakai sebagai lapisan latar di belakang teks
(`.awan`), bukan sebagai ornamen sudut. Contoh pemakaian yang salah tersimpan di
`referensi/Kesalahan.png` sebagai pembanding.

Sumbernya `Hias Kiri Bawah.png` dan `Hias Bawah Kanan.png` — pita rendah melebar
yang mengisi penuh dasar halaman. Berkas lama `Hias.png` / `Hias kanan.png`
bentuknya jauh lebih tegak dan **sudah tidak dipakai**.

Ukuran pakainya di CSS memakai `vw` **tanpa batas piksel**, karena pita ini
digambar menempel sudut kanvas selebar poster: dipatok piksel, dasar halaman
malah menganga di monitor lebar.

Pita emasnya sengaja **menimpa pita motif** dan jatuh sampai tepi paling bawah,
sama seperti di poster. Karena itu `<div class="hias-bawah">` harus ditulis
**sesudah** `<div class="pita pita-bawah">` di `index.html`: pita motif
ber-`opacity:0.85`, dan elemen ber-opacity dilukis seolah-olah punya `z-index:0`,
jadi di antara sesama `z-index:0` yang menentukan siapa di atas hanya urutan DOM.
Kalau urutannya dibalik, ujung pita emasnya ketutupan motif.
