/* ============================================================
   Counting Down — Striving 3 INT & 4 2026 Gontor 3
   Halaman publik: hitung mundur + daftar seluruh acara.

   Data diambil dari events.json (diubah lewat admin.html). Kalau berkas itu
   gagal dimuat — misalnya halaman dibuka langsung lewat file:// — dipakai
   salinan cadangan DATA_CADANGAN di bawah, sehingga halaman tidak pernah kosong.

   Seluruh perhitungan memakai Waktu Indonesia Barat (kolom "zona" di
   events.json), bukan zona waktu perangkat, supaya angka yang dilihat santri
   sama persis di semua HP.

   Untuk menguji tampilan pada tanggal tertentu tanpa mengubah jam komputer:
       index.html?tanggal=2026-10-12
       index.html?tanggal=2026-10-12T19:30
   ============================================================ */
(function () {
  'use strict';

  var BERKAS_DATA = 'events.json';
  var JEDA_MUAT_ULANG = 5 * 60 * 1000;      // ambil ulang events.json tiap 5 menit

  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  var DATA_CADANGAN = {
    judul: 'Counting Down',
    subjudul: "Rangkaian Acara Akhir Tahun — Public Speaking, Volksong, Haflatu Tilawatil Qur'an, Kibar Show, hingga Mugus & ACE",
    tagline: 'Forever Striving for an Authentic Masterpiece',
    zona: '+07:00',
    acara: [
      { nama: 'Pembacaan Panitia PSC, Volksong, HTQ', tanggal: '2026-09-02' },
      { nama: 'Final Public Speaking', tanggal: '2026-09-13' },
      { nama: 'Gladi 1 Volksong', tanggal: '2026-09-14' },
      { nama: 'Gladi 2 Volksong', tanggal: '2026-09-16' },
      { nama: 'Vocal Group Among Hostel', tanggal: '2026-09-18' },
      { nama: "Pembukaan Haflatu Tilawatil Qur'an", tanggal: '2026-09-21' },
      { nama: "Final 1 Haflatu Tilawatil Qur'an", tanggal: '2026-10-04' },
      { nama: "Final 2 Haflatu Tilawatil Qur'an", tanggal: '2026-10-06' },
      { nama: 'Malam Puncak HTQ', tanggal: '2026-10-12' },
      { nama: 'Pembacaan Panitia Kibar Show', tanggal: '2026-10-16' },
      { nama: 'Pemilihan Ketua Dema', tanggal: '2026-11-01' },
      { nama: 'PPL Perdana', tanggal: '2026-11-05' },
      { nama: 'Kibar Show', tanggal: '2026-11-06' },
      { nama: 'PPL Gelombang 1', tanggal: '2026-11-12' },
      { nama: 'Pembacaan Panitia Mugus & ACE', tanggal: '2026-11-13' },
      { nama: 'Musyawarah Gugusdepan (Mugus) — Hari 1', tanggal: '2026-12-03' },
      { nama: 'Musyawarah Gugusdepan (Mugus) — Hari 2', tanggal: '2026-12-04' },
      { nama: 'ACE — Ambalan Creativity Event', tanggal: '2026-12-10' }
    ]
  };

  /* ---------------- waktu ---------------- */

  /** "+07:00" -> 420 menit. Zona tak dikenal dianggap WIB. */
  function offsetMenit(zona) {
    var m = /^([+-])(\d{2}):?(\d{2})$/.exec(String(zona || ''));
    if (!m) return 420;
    var menit = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
    return m[1] === '-' ? -menit : menit;
  }

  function duaDigit(n) { return String(n).padStart(2, '0'); }

  /**
   * Kode tanggal "YYYY-MM-DD" menurut jam dinding di zona yang diminta.
   * Dipakai untuk menentukan "hari ini" secara seragam di semua perangkat.
   */
  function kodeTanggal(waktu, zona) {
    var utc = waktu.getTime() + waktu.getTimezoneOffset() * 60000;
    var z = new Date(utc + offsetMenit(zona) * 60000);
    return z.getFullYear() + '-' + duaDigit(z.getMonth() + 1) + '-' + duaDigit(z.getDate());
  }

  /** Saat acara dimulai, sebagai instan sungguhan. Tanpa jam dianggap pukul 00.00. */
  function instanAcara(acara, zona) {
    var jam = /^\d{2}:\d{2}$/.test(acara.jam || '') ? acara.jam : '00:00';
    return new Date(acara.tanggal + 'T' + jam + ':00' + (zona || '+07:00'));
  }

  /** Selisih hari kalender antara dua kode "YYYY-MM-DD". */
  function selisihHari(dari, sampai) {
    return Math.round((Date.parse(sampai + 'T00:00:00Z') - Date.parse(dari + 'T00:00:00Z')) / 86400000);
  }

  /** Objek Date dari kode tanggal, hanya untuk mengambil nama hari & bulan. */
  function bagianTanggal(kode) {
    var p = kode.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }

  function teksTanggalPanjang(kode, jam) {
    var d = bagianTanggal(kode);
    var teks = HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' +
               BULAN_PANJANG[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    if (/^\d{2}:\d{2}$/.test(jam || '')) teks += ' · pukul ' + jam.replace(':', '.') + ' WIB';
    return teks;
  }

  /* ---------------- jam uji coba (?tanggal=) ---------------- */

  var geserUji = 0;
  (function siapkanJamUji() {
    var cocok = /[?&]tanggal=([^&]+)/.exec(window.location.search);
    if (!cocok) return;
    var nilai = decodeURIComponent(cocok[1]);
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(nilai)) return;
    if (nilai.length === 10) nilai += 'T08:00';
    var palsu = new Date(nilai + ':00+07:00');
    if (isNaN(palsu)) return;
    geserUji = palsu.getTime() - Date.now();
    console.info('[Counting Down] mode uji — "hari ini" dianggap ' + nilai);
  })();

  function sekarang() { return new Date(Date.now() + geserUji); }

  /* ---------------- data ---------------- */

  function rapikan(data) {
    var bersih = data && typeof data === 'object' ? data : {};
    var acara = Array.isArray(bersih.acara) ? bersih.acara : [];
    acara = acara
      .filter(function (a) { return a && a.nama && /^\d{4}-\d{2}-\d{2}$/.test(a.tanggal); })
      .map(function (a) {
        return {
          nama: String(a.nama),
          tanggal: a.tanggal,
          jam: /^\d{2}:\d{2}$/.test(a.jam || '') ? a.jam : '',
          keterangan: a.keterangan ? String(a.keterangan) : ''
        };
      })
      .sort(function (a, b) {
        return a.tanggal === b.tanggal
          ? (a.jam || '00:00').localeCompare(b.jam || '00:00')
          : a.tanggal.localeCompare(b.tanggal);
      });
    return {
      judul: bersih.judul || DATA_CADANGAN.judul,
      subjudul: bersih.subjudul || DATA_CADANGAN.subjudul,
      tagline: bersih.tagline || DATA_CADANGAN.tagline,
      zona: /^[+-]\d{2}:\d{2}$/.test(bersih.zona || '') ? bersih.zona : '+07:00',
      acara: acara
    };
  }

  function muatData() {
    return fetch(BERKAS_DATA + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function (e) {
        console.warn('[Counting Down] events.json tidak terbaca (' + e.message +
                     '), memakai data cadangan bawaan.');
        return DATA_CADANGAN;
      })
      .then(rapikan);
  }

  /* ---------------- penyusun daftar (dipakai juga oleh pratinjau admin) ---------------- */

  /**
   * Membangun daftar acara ke dalam sebuah elemen.
   * Mengembalikan ringkasan { jumlah, lewat, berikut } untuk bar kemajuan.
   */
  function bangunDaftar(wadah, data, opsi) {
    opsi = opsi || {};
    var hariIni = kodeTanggal(opsi.acuan || sekarang(), data.zona);
    var sembunyikanLewat = !!opsi.sembunyikanLewat;
    var bulanTerakhir = '';
    var berikutDitandai = false;
    var jumlahLewat = 0;
    var berikut = null;
    var tampil = 0;

    wadah.innerHTML = '';

    data.acara.forEach(function (a) {
      var beda = selisihHari(hariIni, a.tanggal);
      var keadaan = beda < 0 ? 'lewat' : (beda === 0 ? 'kini' : 'depan');
      if (keadaan === 'lewat') jumlahLewat++;
      if (!berikut && keadaan !== 'lewat') berikut = a;
      if (keadaan === 'lewat' && sembunyikanLewat) return;

      var kunciBulan = a.tanggal.slice(0, 7);
      if (kunciBulan !== bulanTerakhir) {
        bulanTerakhir = kunciBulan;
        var judulBulan = document.createElement('p');
        judulBulan.className = 'bulan';
        judulBulan.textContent = BULAN_PANJANG[+kunciBulan.slice(5, 7) - 1] + ' ' + kunciBulan.slice(0, 4);
        wadah.appendChild(judulBulan);
      }

      var d = bagianTanggal(a.tanggal);
      var baris = document.createElement('div');
      baris.className = 'baris';

      var kelasLencana, teksLencana;
      if (keadaan === 'lewat') {
        baris.classList.add('lewat');
        kelasLencana = 'selesai';
        teksLencana = 'Selesai';
      } else if (keadaan === 'kini') {
        baris.classList.add('kini');
        kelasLencana = 'kini';
        teksLencana = 'Hari ini';
      } else if (!berikutDitandai) {
        berikutDitandai = true;
        baris.classList.add('berikut');
        kelasLencana = 'berikut';
        teksLencana = 'H-' + beda;
      } else {
        kelasLencana = '';
        teksLencana = 'H-' + beda;
      }

      var kotak = document.createElement('div');
      kotak.className = 'kotak-tanggal';
      kotak.innerHTML = '<div class="hari"></div><div class="bln"></div>';
      kotak.querySelector('.hari').textContent = d.getUTCDate();
      kotak.querySelector('.bln').textContent = BULAN[d.getUTCMonth()];

      var info = document.createElement('div');
      info.className = 'info';
      var nama = document.createElement('div');
      nama.className = 'nama';
      nama.textContent = a.nama;
      var meta = document.createElement('div');
      meta.className = 'meta';
      var potongan = [HARI[d.getUTCDay()]];
      if (a.jam) potongan.push('pukul ' + a.jam.replace(':', '.') + ' WIB');
      if (a.keterangan) potongan.push(a.keterangan);
      meta.textContent = potongan.join(' · ');
      info.appendChild(nama);
      info.appendChild(meta);

      var lencana = document.createElement('span');
      lencana.className = 'lencana' + (kelasLencana ? ' ' + kelasLencana : '');
      lencana.textContent = teksLencana;

      baris.appendChild(kotak);
      baris.appendChild(info);
      baris.appendChild(lencana);
      wadah.appendChild(baris);
      tampil++;
    });

    return {
      jumlah: data.acara.length,
      lewat: jumlahLewat,
      tampil: tampil,
      hariIni: hariIni,
      berikut: berikut
    };
  }

  /* ---------------- halaman publik ---------------- */

  var el = {};
  var data = null;
  var ringkasan = null;
  var sembunyikanLewat = false;

  function ambil(id) { return document.getElementById(id); }

  function bacaPilihan() {
    try { return localStorage.getItem('cd-sembunyikan-lewat') === '1'; }
    catch (e) { return false; }
  }
  function simpanPilihan(nilai) {
    try { localStorage.setItem('cd-sembunyikan-lewat', nilai ? '1' : '0'); }
    catch (e) { /* mode privat / storage diblokir — abaikan saja */ }
  }

  function gambarDaftar() {
    ringkasan = bangunDaftar(el.daftar, data, { sembunyikanLewat: sembunyikanLewat });
    el.daftarKosong.hidden = ringkasan.tampil > 0;

    var total = ringkasan.jumlah;
    var lewat = ringkasan.lewat;
    el.kemajuanLabel.textContent = total
      ? lewat + ' dari ' + total + ' acara telah berlalu'
      : 'Belum ada acara terdaftar';
    el.kemajuanIsi.style.width = total ? (lewat / total * 100).toFixed(1) + '%' : '0%';
  }

  function gambarHero() {
    var kini = sekarang();
    var hariIni = kodeTanggal(kini, data.zona);
    var berikut = null;

    for (var i = 0; i < data.acara.length; i++) {
      if (selisihHari(hariIni, data.acara[i].tanggal) >= 0) { berikut = data.acara[i]; break; }
    }

    if (!berikut) {                       // seluruh rangkaian sudah lewat
      var akhir = data.acara[data.acara.length - 1];
      el.labelHero.textContent = 'Rangkaian acara';
      el.heroAcara.textContent = akhir ? akhir.nama : '—';
      el.heroTanggal.textContent = akhir ? teksTanggalPanjang(akhir.tanggal, akhir.jam) : '';
      el.timer.hidden = true;
      el.penanda.hidden = false;
      el.penanda.className = 'penanda selesai';
      el.penanda.textContent = 'Seluruh rangkaian acara telah selesai';
      return;
    }

    el.labelHero.textContent = 'Menuju';
    el.heroAcara.textContent = berikut.nama;
    el.heroTanggal.textContent = teksTanggalPanjang(berikut.tanggal, berikut.jam);

    var sisa = instanAcara(berikut, data.zona).getTime() - kini.getTime();
    var hariIniJuga = selisihHari(hariIni, berikut.tanggal) === 0;

    if (sisa <= 0 && hariIniJuga) {       // acaranya hari ini dan jamnya sudah tiba
      el.timer.hidden = true;
      el.penanda.hidden = false;
      el.penanda.className = 'penanda';
      el.penanda.textContent = 'Acara berlangsung hari ini';
      return;
    }

    el.timer.hidden = false;
    el.penanda.hidden = true;

    var detik = Math.max(0, Math.floor(sisa / 1000));
    el.tHari.textContent = duaDigit(Math.floor(detik / 86400));
    el.tJam.textContent = duaDigit(Math.floor((detik % 86400) / 3600));
    el.tMenit.textContent = duaDigit(Math.floor((detik % 3600) / 60));
    el.tDetik.textContent = duaDigit(detik % 60);
  }

  function pasangData(dataBaru) {
    data = dataBaru;
    document.title = data.judul + ' — Striving 2026';
    ambil('judul').textContent = data.judul;
    ambil('subjudul').textContent = data.subjudul;
    ambil('tagline').textContent = data.tagline;
    gambarDaftar();
    gambarHero();
  }

  function mulai() {
    ['labelHero', 'heroAcara', 'heroTanggal', 'timer', 'penanda',
     'tHari', 'tJam', 'tMenit', 'tDetik',
     'kemajuanLabel', 'kemajuanIsi', 'daftarKosong'].forEach(function (id) { el[id] = ambil(id); });
    el.daftar = ambil('daftarAcara');

    sembunyikanLewat = bacaPilihan();
    var saklar = ambil('saklarLewat');
    saklar.checked = sembunyikanLewat;
    saklar.addEventListener('change', function () {
      sembunyikanLewat = saklar.checked;
      simpanPilihan(sembunyikanLewat);
      gambarDaftar();
    });

    muatData().then(pasangData);

    // detik berjalan; daftar dibangun ulang hanya saat tanggal WIB berganti
    setInterval(function () {
      if (!data) return;
      gambarHero();
      var hariIni = kodeTanggal(sekarang(), data.zona);
      if (ringkasan && hariIni !== ringkasan.hariIni) gambarDaftar();
    }, 1000);

    // ambil ulang events.json berkala, supaya layar yang dibiarkan terbuka ikut terbarui
    setInterval(function () { muatData().then(pasangData); }, JEDA_MUAT_ULANG);
  }

  // dipakai halaman admin untuk pratinjau memakai logika yang sama persis
  window.CountingDown = {
    rapikan: rapikan,
    bangunDaftar: bangunDaftar,
    kodeTanggal: kodeTanggal,
    selisihHari: selisihHari,
    teksTanggalPanjang: teksTanggalPanjang,
    sekarang: sekarang,
    DATA_CADANGAN: DATA_CADANGAN
  };

  if (document.getElementById('daftarAcara')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
    else mulai();
  }
})();
