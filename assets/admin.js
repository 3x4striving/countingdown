/* ============================================================
   Counting Down — panel kelola acara

   Halaman ini menyimpan events.json langsung ke repo GitHub lewat Contents API,
   jadi tidak ada server dan tidak ada database yang perlu dijaga.

       GET  /repos/{owner}/{repo}/contents/events.json   -> isi + sha
       PUT  /repos/{owner}/{repo}/contents/events.json   -> simpan (butuh sha)

   `sha` adalah sidik jari versi berkas yang sedang kita sunting. GitHub menolak
   PUT kalau sha-nya sudah tidak cocok — itulah pengaman kalau ada dua orang
   menyunting bersamaan: yang kedua diberi tahu, bukan menimpa diam-diam.

   Token disimpan di localStorage (kalau dicentang "ingat") atau sessionStorage.
   Ia tidak pernah ikut tersimpan ke dalam berkas mana pun di repo.
   ============================================================ */
(function () {
  'use strict';

  var CD = window.CountingDown;
  var BERKAS = 'events.json';
  var KUNCI_KONFIG = 'cd-konfig';
  var KUNCI_TOKEN = 'cd-token';

  var data = null;      // { judul, subjudul, tagline, zona, acara: [...] }
  var sha = null;       // sha berkas events.json versi yang sedang disunting
  var adaPerubahan = false;

  function $(id) { return document.getElementById(id); }

  /* ---------------- penyimpanan browser ---------------- */

  function bacaKonfig() {
    try { return JSON.parse(localStorage.getItem(KUNCI_KONFIG) || '{}'); }
    catch (e) { return {}; }
  }
  function simpanKonfig(k) {
    try { localStorage.setItem(KUNCI_KONFIG, JSON.stringify(k)); } catch (e) {}
  }
  function bacaToken() {
    try { return sessionStorage.getItem(KUNCI_TOKEN) || localStorage.getItem(KUNCI_TOKEN) || ''; }
    catch (e) { return ''; }
  }
  function simpanToken(token, ingat) {
    try {
      sessionStorage.removeItem(KUNCI_TOKEN);
      localStorage.removeItem(KUNCI_TOKEN);
      if (!token) return;
      (ingat ? localStorage : sessionStorage).setItem(KUNCI_TOKEN, token);
    } catch (e) {}
  }

  /* ---------------- pesan ---------------- */

  function pesan(wadahId, jenis, isiHtml) {
    var wadah = $(wadahId);
    if (!isiHtml) { wadah.innerHTML = ''; return; }
    wadah.innerHTML = '<div class="pesan ' + jenis + '"></div>';
    wadah.firstChild.innerHTML = isiHtml;
  }

  /* ---------------- base64 yang aman untuk huruf beraksen ---------------- */

  function dariBase64(b64) {
    var biner = atob(String(b64).replace(/\s/g, ''));
    var byte = new Uint8Array(biner.length);
    for (var i = 0; i < biner.length; i++) byte[i] = biner.charCodeAt(i);
    return new TextDecoder('utf-8').decode(byte);
  }

  function keBase64(teks) {
    var byte = new TextEncoder().encode(teks);
    var biner = '';
    for (var i = 0; i < byte.length; i++) biner += String.fromCharCode(byte[i]);
    return btoa(biner);
  }

  /* ---------------- GitHub API ---------------- */

  function konfigSekarang() {
    return {
      owner: $('fOwner').value.trim(),
      repo: $('fRepo').value.trim(),
      cabang: $('fCabang').value.trim() || 'main'
    };
  }

  function alamatIsi(k) {
    return 'https://api.github.com/repos/' + encodeURIComponent(k.owner) + '/' +
           encodeURIComponent(k.repo) + '/contents/' + BERKAS;
  }

  function kepala(token) {
    var h = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  }

  /** Menerjemahkan kegagalan API jadi kalimat yang bisa ditindaklanjuti. */
  function jelaskanGalat(status, pesanApi) {
    if (status === 401) return 'Token ditolak. Token salah ketik atau sudah kedaluwarsa — buat token baru di GitHub.';
    if (status === 403) return 'Token tidak punya izin menulis berkas ini. Pastikan izin <em>Contents: Read and write</em> untuk repo yang benar.';
    if (status === 404) return 'Berkas tidak ditemukan. Periksa nama pemilik, nama repo, dan pastikan <code>events.json</code> memang ada di repo itu. (Kalau repo privat, token wajib diisi.)';
    if (status === 409 || status === 422) return 'Data di GitHub sudah berubah sejak terakhir dimuat. Tekan <strong>Muat ulang dari GitHub</strong>, lalu ulangi suntingannya supaya perubahan orang lain tidak tertimpa.';
    return 'Gagal menghubungi GitHub (kode ' + status + ')' + (pesanApi ? ': ' + pesanApi : '') + '.';
  }

  function muatDariGitHub() {
    var k = konfigSekarang();
    if (!k.owner || !k.repo) {
      return Promise.reject({ pesan: 'Nama pemilik dan nama repo harus diisi dulu.' });
    }
    var token = $('fToken').value.trim() || bacaToken();
    return fetch(alamatIsi(k) + '?ref=' + encodeURIComponent(k.cabang) + '&t=' + Date.now(),
                 { headers: kepala(token), cache: 'no-store' })
      .then(function (r) {
        return r.json().then(function (isi) {
          if (!r.ok) throw { pesan: jelaskanGalat(r.status, isi && isi.message) };
          return isi;
        });
      })
      .then(function (isi) {
        sha = isi.sha;
        return CD.rapikan(JSON.parse(dariBase64(isi.content)));
      });
  }

  function simpanKeGitHub(teks) {
    var k = konfigSekarang();
    var token = $('fToken').value.trim() || bacaToken();
    if (!token) return Promise.reject({ pesan: 'Token belum diisi — tanpa token, perubahan tidak bisa dikirim ke GitHub. Gunakan <strong>Unduh events.json</strong> kalau ingin mengunggahnya sendiri.' });
    if (!sha) return Promise.reject({ pesan: 'Data belum pernah dimuat dari GitHub. Tekan <strong>Sambungkan &amp; muat data</strong> dulu.' });

    var badan = {
      message: 'Perbarui acara — ' + data.acara.length + ' acara (via admin)',
      content: keBase64(teks),
      sha: sha,
      branch: k.cabang
    };
    return fetch(alamatIsi(k), {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, kepala(token)),
      body: JSON.stringify(badan)
    }).then(function (r) {
      return r.json().then(function (isi) {
        if (!r.ok) throw { pesan: jelaskanGalat(r.status, isi && isi.message) };
        sha = isi.content && isi.content.sha;   // sha baru untuk simpanan berikutnya
        return isi;
      });
    });
  }

  /* ---------------- data & tabel ---------------- */

  function bacaFormulirJudul() {
    data.judul = $('fJudul').value.trim() || 'Counting Down';
    data.subjudul = $('fSubjudul').value.trim();
    data.tagline = $('fTagline').value.trim();
  }

  function isiFormulirJudul() {
    $('fJudul').value = data.judul || '';
    $('fSubjudul').value = data.subjudul || '';
    $('fTagline').value = data.tagline || '';
  }

  function tandaiBerubah() {
    adaPerubahan = true;
    pesan('pesanSimpan', '', '');
  }

  function buatBaris(acara, indeks) {
    var baris = document.createElement('div');
    baris.className = 'tabel-baris';

    function kotak(jenis, nilai, kunci, tempatContoh) {
      var i = document.createElement('input');
      i.type = jenis;
      i.value = nilai || '';
      if (tempatContoh) i.placeholder = tempatContoh;
      i.addEventListener('input', function () {
        acara[kunci] = i.value;
        tandaiBerubah();
        perbaruiRingkasan();
      });
      return i;
    }

    baris.appendChild(kotak('date', acara.tanggal, 'tanggal'));
    baris.appendChild(kotak('time', acara.jam, 'jam'));
    baris.appendChild(kotak('text', acara.nama, 'nama', 'Nama acara'));
    baris.appendChild(kotak('text', acara.keterangan, 'keterangan', 'Keterangan (opsional)'));

    var aksi = document.createElement('div');
    aksi.className = 'aksi';
    var hapus = document.createElement('button');
    hapus.className = 'tombol bahaya';
    hapus.type = 'button';
    hapus.textContent = 'Hapus';
    hapus.addEventListener('click', function () {
      data.acara.splice(indeks, 1);
      tandaiBerubah();
      gambarTabel();
    });
    aksi.appendChild(hapus);
    baris.appendChild(aksi);

    return baris;
  }

  function gambarTabel() {
    var wadah = $('barisAcara');
    wadah.innerHTML = '';
    data.acara.forEach(function (a, i) { wadah.appendChild(buatBaris(a, i)); });
    perbaruiRingkasan();
  }

  function perbaruiRingkasan() {
    $('jumlahAcara').textContent = '· ' + data.acara.length + ' acara';
    gambarPratinjau();
  }

  function gambarPratinjau() {
    var bersih = CD.rapikan({
      judul: data.judul, subjudul: data.subjudul, tagline: data.tagline,
      zona: data.zona, acara: data.acara
    });
    CD.bangunDaftar($('pratinjau'), bersih, {});
  }

  /** Menyusun ulang data jadi teks JSON yang rapi, sekaligus memeriksa isinya. */
  function siapkanJson() {
    bacaFormulirJudul();

    var galat = [];
    data.acara.forEach(function (a, i) {
      var no = 'Baris ' + (i + 1);
      if (!String(a.nama || '').trim()) galat.push(no + ': nama acara masih kosong.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(a.tanggal || '')) galat.push(no + ': tanggal belum diisi atau tidak sah.');
      else if (isNaN(Date.parse(a.tanggal + 'T00:00:00Z'))) galat.push(no + ': tanggal tidak ada di kalender.');
      if (a.jam && !/^\d{2}:\d{2}$/.test(a.jam)) galat.push(no + ': jam harus berbentuk 19:30.');
    });
    if (galat.length) throw { pesan: 'Perlu dibetulkan dulu:<br>• ' + galat.join('<br>• ') };

    var bersih = CD.rapikan({
      judul: data.judul, subjudul: data.subjudul, tagline: data.tagline,
      zona: data.zona, acara: data.acara
    });

    var kembar = [];
    bersih.acara.forEach(function (a, i) {
      var b = bersih.acara[i - 1];
      if (b && b.tanggal === a.tanggal && b.nama === a.nama) kembar.push(a.nama + ' (' + a.tanggal + ')');
    });

    data.acara = bersih.acara;      // simpan urutan yang sudah dirapikan
    gambarTabel();

    return {
      teks: JSON.stringify(bersih, null, 2) + '\n',
      kembar: kembar
    };
  }

  /* ---------------- tombol ---------------- */

  function pasangTombol() {
    $('btnSambung').addEventListener('click', function () {
      var k = konfigSekarang();
      simpanKonfig(k);
      simpanToken($('fToken').value.trim(), $('fIngat').checked);
      pesan('pesanKoneksi', 'info', 'Menghubungi GitHub…');
      muatDariGitHub().then(function (baru) {
        data = baru;
        pesan('pesanKoneksi', 'sukses',
          'Tersambung ke <strong>' + k.owner + '/' + k.repo + '</strong> (cabang ' + k.cabang + '). ' +
          data.acara.length + ' acara dimuat.');
        adaPerubahan = false;
        isiFormulirJudul();
        gambarTabel();
      }).catch(function (e) {
        pesan('pesanKoneksi', 'galat', e && e.pesan ? e.pesan : 'Gagal memuat: ' + e);
      });
    });

    $('btnLupakan').addEventListener('click', function () {
      simpanToken('', false);
      $('fToken').value = '';
      $('fIngat').checked = false;
      pesan('pesanKoneksi', 'info', 'Token dihapus dari browser ini.');
    });

    $('btnTambah').addEventListener('click', function () {
      data.acara.push({ nama: '', tanggal: '', jam: '', keterangan: '' });
      tandaiBerubah();
      gambarTabel();
      var kotak = $('barisAcara').lastChild;
      if (kotak) kotak.querySelector('input[type=date]').focus();
    });

    $('btnSimpan').addEventListener('click', function () {
      var siap;
      try { siap = siapkanJson(); }
      catch (e) { pesan('pesanSimpan', 'galat', e.pesan); return; }

      var awalan = siap.kembar.length
        ? '<strong>Catatan:</strong> ada acara kembar — ' + siap.kembar.join(', ') + '.<br>'
        : '';

      pesan('pesanSimpan', 'info', 'Menyimpan ke GitHub…');
      simpanKeGitHub(siap.teks).then(function () {
        adaPerubahan = false;
        pesan('pesanSimpan', 'sukses', awalan +
          'Tersimpan. GitHub Pages membangun ulang situsnya lebih dulu, jadi ' +
          'halaman santri akan menampilkan perubahan ini sekitar 1 menit lagi.');
      }).catch(function (e) {
        pesan('pesanSimpan', 'galat', e && e.pesan ? e.pesan : 'Gagal menyimpan: ' + e);
      });
    });

    $('btnUnduh').addEventListener('click', function () {
      var siap;
      try { siap = siapkanJson(); }
      catch (e) { pesan('pesanSimpan', 'galat', e.pesan); return; }

      var berkas = new Blob([siap.teks], { type: 'application/json' });
      var tautan = document.createElement('a');
      tautan.href = URL.createObjectURL(berkas);
      tautan.download = BERKAS;
      document.body.appendChild(tautan);
      tautan.click();
      document.body.removeChild(tautan);
      setTimeout(function () { URL.revokeObjectURL(tautan.href); }, 1000);
      pesan('pesanSimpan', 'sukses',
        'Berkas <code>events.json</code> diunduh. Unggah berkas itu ke repo GitHub ' +
        '(buka repo → klik <code>events.json</code> → ikon pensil → tempel isinya → Commit).');
    });

    $('btnMuatUlang').addEventListener('click', function () {
      pesan('pesanSimpan', 'info', 'Memuat ulang dari GitHub…');
      muatDariGitHub().then(function (baru) {
        data = baru;
        adaPerubahan = false;
        isiFormulirJudul();
        gambarTabel();
        pesan('pesanSimpan', 'sukses', 'Data terbaru dari GitHub sudah dimuat (' + data.acara.length + ' acara).');
      }).catch(function (e) {
        pesan('pesanSimpan', 'galat', e && e.pesan ? e.pesan : 'Gagal memuat: ' + e);
      });
    });

    window.addEventListener('beforeunload', function (e) {
      if (!adaPerubahan) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  /* ---------------- mulai ---------------- */

  function mulai() {
    var k = bacaKonfig();
    $('fOwner').value = k.owner || '';
    $('fRepo').value = k.repo || '';
    $('fCabang').value = k.cabang || 'main';
    var token = bacaToken();
    $('fToken').value = token;
    try { $('fIngat').checked = !!localStorage.getItem(KUNCI_TOKEN); } catch (e) {}

    pasangTombol();

    // muat berkas lokal dulu supaya tabelnya langsung bisa disunting,
    // baru ambil versi GitHub kalau sambungannya sudah pernah diatur
    fetch(BERKAS + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function () { return CD.DATA_CADANGAN; })
      .then(function (isi) {
        data = CD.rapikan(isi);
        isiFormulirJudul();
        gambarTabel();
        if (k.owner && k.repo) $('btnSambung').click();
        else pesan('pesanKoneksi', 'info',
          'Belum tersambung ke GitHub. Isi kolom di atas untuk menyimpan langsung ke repo, ' +
          'atau langsung sunting daftarnya lalu pakai <strong>Unduh events.json</strong>.');
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
  else mulai();
})();
