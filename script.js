/* ==========================================================================
   Mintaswa 2022 Archive, script.js
   Hamburger nav, language toggle, scroll reveal, modals, micro-interactions,
   Supabase-backed live gallery + guestbook messages, passcode-gated editing
   ========================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     0. Supabase client
     NOTE: the anon key below was provided starting with a capital "eyJ" -
     standard Supabase/JWT keys start with a lowercase "eyJ". Double-check
     this value in Supabase (Project Settings > API) if the site can't
     read/write data; it may be a transcription typo.
     --------------------------------------------------------------------- */
  var SUPABASE_URL = "https://feyfojsezizwwifdwhpe.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleWZvanNleml6d3dpZmR3aHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4Nzg0ODQsImV4cCI6MjEwMjQ1NDQ4NH0.hz4IXXNPC71_0U3zpfzGysacrzufINQYVTOF3HZflc0";

  var sb = null;
  try {
    if (window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      console.error("Supabase library belum termuat (cek koneksi internet / CDN).");
    }
  } catch (err) {
    console.error("Gagal membuat Supabase client:", err);
  }

  var GALLERY_BUCKET = "gallery";
  var MAX_MESSAGES = 10;
  var PASSCODE = "mintaswa2022";

  /* ---------------------------------------------------------------------
     0b. GitHub repo photos (assets/ = Album Kenangan archive photos,
     assets2/ = school photos + audio). File lists are NOT hardcoded -
     they're discovered at runtime via the GitHub Contents API, so simply
     adding/removing files in those folders on GitHub updates the site
     automatically. If this site ever moves to a different repo/owner,
     update the three constants below.
     --------------------------------------------------------------------- */
  var GITHUB_OWNER = "ArcLabsX";
  var GITHUB_REPO = "mintaswa2022-archives";
  var GITHUB_BRANCH = "main";
  var ASSETS_PATH = "assets";
  var ASSETS2_PATH = "assets2";
  var IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
  var AUDIO_EXT = ["mp3", "wav", "m4a", "ogg", "aac"];

  function fileExt(name) {
    var parts = (name || "").split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  }
  function isImageName(name) { return IMAGE_EXT.indexOf(fileExt(name)) !== -1; }
  function isAudioName(name) { return AUDIO_EXT.indexOf(fileExt(name)) !== -1; }

  async function fetchGithubFolder(path) {
    var url = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + path + "?ref=" + GITHUB_BRANCH;
    try {
      var res = await fetch(url, { headers: { "Accept": "application/vnd.github+json" } });
      if (!res.ok) throw new Error("GitHub API responded " + res.status);
      var data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("fetchGithubFolder(" + path + ") error:", err);
      return [];
    }
  }
  function sortByNameAlpha(items) {
    return items.slice().sort(function (a, b) {
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
  }
  function toGithubPhotoObj(item, folderPath) {
    return {
      id: "gh_" + folderPath + "_" + item.name,
      image_url: folderPath + "/" + encodeURIComponent(item.name),
      uploader_name: null,
      source: "github",
      created_at: null
    };
  }

  var githubAlbumPhotos = [];
  async function loadGithubAlbumPhotos() {
    var items = await fetchGithubFolder(ASSETS_PATH);
    var images = sortByNameAlpha(items.filter(function (it) { return it.type === "file" && isImageName(it.name); }));
    githubAlbumPhotos = images.map(function (it) { return toGithubPhotoObj(it, ASSETS_PATH); });
  }

  /* ---------------------------------------------------------------------
     1. i18n dictionary
     --------------------------------------------------------------------- */
  var translations = {
    id: {
      "nav.menu": "Menu",
      "nav.home": "Beranda",
      "nav.profil": "Profil Angkatan",
      "nav.album": "Album Kenangan",
      "nav.mintaswa": "Mintaswa",
      "nav.kirim": "Kirim Pesan",
      "nav.manage": "Kelola foto (edit/hapus)",
      "hero.desc": "<strong>Mintaswa 2022</strong><br>Arsip digital perjalanan kita sejak langkah pertama di tahun 2016 hingga kelulusan di tahun 2022. Sebuah ruang untuk menyimpan kembali cerita, kenangan, dan jejak satu angkatan di MINU Tambak Sumur.",
      "hero.btn": "Tentang Arsip",
      "rekaman.title": "Jejak Angkatan 2022",
      "rekaman.album": "Album kenangan",
      "rekaman.kirim": "Kirim pesan",
      "profil.viewbtn": "lihat profil angkatan",
      "profil.desc": "Yuk, kenang teman-teman kita yang pernah tumbuh dan belajar bersama di MINU Tambak Sumur.",
      "kenangan.title": "Album Kenangan",
      "kenangan.viewall": "lihat semua",
      "kenangan.addphoto": "Tambah foto dari galeri",
      "mintaswa.desc": "MINU Tambak Sumur (2016–2022) pernah menjadi saksi bisu masa-masa saat kita pertama kali belajar, berteman, dan bertumbuh bersama.",
      "mintaswa.t2016": "Langkah pertama masuk MINU Tambak Sumur",
      "mintaswa.t2019": "Melewati masa Daring dan Luring",
      "mintaswa.t2022": "Tahun Kelulusan",
      "form.nama": "Namamu",
      "form.pesan": "Tulis kenangan atau pesanmu...",
      "about.p1": "Mintaswa 2022 Archive lahir dari keinginan sederhana: agar cerita satu angkatan tidak hilang ditelan waktu. Setiap foto, setiap nama, dan setiap kenangan di sini adalah jejak perjalanan kita di masa sekolah.",
      "about.p2": "Situs ini untuk Alumni 2022 MINU Tambak Sumur, sebagai ruang untuk kembali, mengingat, dan merayakan satu sama lain, kapan pun dan di mana pun.",
      "footer.text": "Mintaswa 2022 Archive, dibuat dengan ♥ untuk Class of 2022 MINU Tambak Sumur",
      "toast.sent": "Pesan terkirim! Terima kasih sudah singgah ✈",
      "toast.fillform": "Isi nama dan pesanmu dulu, ya.",
      "toast.comingsoon": "Repository lain masih menyusul, ya.",
      "toast.photoadded": "Foto berhasil ditambahkan ke album.",
      "toast.captionupdated": "Keterangan foto berhasil diperbarui.",
      "toast.photodeleted": "Foto berhasil dihapus.",
      "toast.deleteerror": "Gagal menghapus foto. Coba lagi.",
      "toast.senderror": "Gagal mengirim pesan. Coba lagi.",
      "toast.noconnection": "Belum terhubung ke server. Coba refresh halaman.",
      "lightbox.counter": "Foto {n} dari {total}",
      "feed.empty": "Belum ada pesan. Jadi yang pertama kirim pesan!",
      "feed.loaderror": "Gagal memuat pesan. Coba refresh halaman.",
      "gallery.empty": "Belum ada foto. Jadi yang pertama upload!",
      "gallery.loaderror": "Gagal memuat foto. Coba refresh halaman.",
      "code.title": "Masukkan Kode",
      "code.hint": "Fitur ini khusus untuk teman-teman Mintaswa 2022. Masukkan kode rahasia untuk melanjutkan.",
      "code.placeholder": "Kode rahasia",
      "code.wrong": "Kode salah, coba lagi.",
      "action.cancel": "Batal",
      "action.confirm": "Konfirmasi",
      "action.save": "Simpan",
      "action.saving": "Menyimpan...",
      "action.delete": "Hapus",
      "action.editcaption": "Edit keterangan",
      "upload.title": "Tambah Foto Kenangan",
      "upload.hint": "Pilih foto kenangan dari galeri HP-mu.",
      "upload.choose": "+ Pilih foto",
      "upload.submit": "Unggah",
      "upload.uploading": "Mengunggah...",
      "upload.needphoto": "Pilih foto dulu, ya.",
      "upload.needname": "Isi namamu dulu, ya.",
      "upload.uploaderror": "Gagal mengunggah foto. Coba lagi.",
      "editphoto.title": "Edit Keterangan Foto",
      "editphoto.hint": "Ubah nama yang tampil pada foto ini.",
      "editphoto.error": "Gagal menyimpan perubahan. Coba lagi.",
      "confirm.title": "Hapus foto ini?",
      "confirm.message": "Tindakan ini tidak bisa dibatalkan.",
      "school.audio": "🔊 Suara Mintaswa",
      "school.headmaster": "Kepala Sekolah",
      "school.staff": "Guru & Staff",
      "school.nophotos": "Foto sekolah belum tersedia."
    },
    en: {
      "nav.menu": "Menu",
      "nav.home": "Home",
      "nav.profil": "Class Profiles",
      "nav.album": "Memory Album",
      "nav.mintaswa": "Mintaswa",
      "nav.kirim": "Send a Message",
      "nav.manage": "Manage photos (edit/delete)",
      "hero.desc": "<strong>Mintaswa 2022</strong><br>A digital archive of our journey, from our first steps in 2016 to graduation in 2022. A space to keep every story, memory, and trace of one class at MINU Tambak Sumur.",
      "hero.btn": "About the Archive",
      "rekaman.title": "Class of 2022 Trail",
      "rekaman.album": "Memory album",
      "rekaman.kirim": "Send a message",
      "profil.viewbtn": "view class profiles",
      "profil.desc": "Let's remember the friends who grew up and learned together at MINU Tambak Sumur.",
      "kenangan.title": "Memory Album",
      "kenangan.viewall": "view all",
      "kenangan.addphoto": "Add photo from gallery",
      "mintaswa.desc": "MINU Tambak Sumur (2016–2022) was a silent witness to the days we first learned, made friends, and grew up together.",
      "mintaswa.t2016": "First steps into MINU Tambak Sumur",
      "mintaswa.t2019": "Through online and in-person school",
      "mintaswa.t2022": "Graduation Year",
      "form.nama": "Your name",
      "form.pesan": "Write a memory or a message...",
      "about.p1": "Mintaswa 2022 Archive was born from a simple wish: that one class's story shouldn't fade with time. Every photo, every name, every memory here traces our journey through our school days.",
      "about.p2": "This site is for the Alumni 2022 of MINU Tambak Sumur, a space to return, remember, and celebrate each other, anytime and anywhere.",
      "footer.text": "Mintaswa 2022 Archive, made with ♥ for the Class of 2022 of MINU Tambak Sumur",
      "toast.sent": "Message sent! Thanks for stopping by ✈",
      "toast.fillform": "Please fill in your name and message first.",
      "toast.comingsoon": "The other repository is coming soon.",
      "toast.photoadded": "Photo added to the album.",
      "toast.captionupdated": "Photo caption updated.",
      "toast.photodeleted": "Photo deleted.",
      "toast.deleteerror": "Couldn't delete the photo. Try again.",
      "toast.senderror": "Couldn't send the message. Try again.",
      "toast.noconnection": "Not connected to the server yet. Try refreshing.",
      "lightbox.counter": "Photo {n} of {total}",
      "feed.empty": "No messages yet. Be the first to send one!",
      "feed.loaderror": "Couldn't load messages. Try refreshing.",
      "gallery.empty": "No photos yet. Be the first to upload!",
      "gallery.loaderror": "Couldn't load photos. Try refreshing.",
      "code.title": "Enter Code",
      "code.hint": "This feature is just for Mintaswa 2022 friends. Enter the secret code to continue.",
      "code.placeholder": "Secret code",
      "code.wrong": "Wrong code, try again.",
      "action.cancel": "Cancel",
      "action.confirm": "Confirm",
      "action.save": "Save",
      "action.saving": "Saving...",
      "action.delete": "Delete",
      "action.editcaption": "Edit caption",
      "upload.title": "Add a Memory Photo",
      "upload.hint": "Pick a memory photo from your phone's gallery.",
      "upload.choose": "+ Choose photo",
      "upload.submit": "Upload",
      "upload.uploading": "Uploading...",
      "upload.needphoto": "Pick a photo first.",
      "upload.needname": "Enter your name first.",
      "upload.uploaderror": "Couldn't upload the photo. Try again.",
      "editphoto.title": "Edit Photo Caption",
      "editphoto.hint": "Change the name shown on this photo.",
      "editphoto.error": "Couldn't save the change. Try again.",
      "confirm.title": "Delete this photo?",
      "confirm.message": "This action can't be undone.",
      "school.audio": "🔊 Sound of Mintaswa",
      "school.headmaster": "Headmaster",
      "school.staff": "Teachers & Staff",
      "school.nophotos": "School photos aren't available yet."
    }
  };

  var currentLang = "id";
  try { currentLang = localStorage.getItem("mintaswa-lang") || "id"; } catch (err) {}

  function applyTranslations(lang) {
    currentLang = lang;
    var dict = translations[lang] || translations.id;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-ph");
      if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
    });
    var label = document.getElementById("langLabel");
    if (label) label.textContent = lang.toUpperCase();
    try { localStorage.setItem("mintaswa-lang", lang); } catch (err) {}
  }

  function t(key) {
    var dict = translations[currentLang] || translations.id;
    return dict[key] !== undefined ? dict[key] : key;
  }

  /* ---------------------------------------------------------------------
     2. Toast helper (used across many features below)
     --------------------------------------------------------------------- */
  var toast = document.getElementById("toast");
  var toastTimer = null;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-open"); }, 2800);
  }

  /* ---------------------------------------------------------------------
     3. Hamburger drawer
     --------------------------------------------------------------------- */
  var hamburgerBtn = document.getElementById("hamburgerBtn");
  var mobileNav = document.getElementById("mobileNav");
  var navOverlay = document.getElementById("navOverlay");
  var mobileNavClose = document.getElementById("mobileNavClose");

  function openNav() {
    mobileNav.classList.add("is-open");
    navOverlay.classList.add("is-open");
    hamburgerBtn.classList.add("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeNav() {
    mobileNav.classList.remove("is-open");
    navOverlay.classList.remove("is-open");
    hamburgerBtn.classList.remove("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  hamburgerBtn.addEventListener("click", function () {
    mobileNav.classList.contains("is-open") ? closeNav() : openNav();
  });
  mobileNavClose.addEventListener("click", closeNav);
  navOverlay.addEventListener("click", closeNav);
  mobileNav.querySelectorAll(".mobile-nav-link").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* ---------------------------------------------------------------------
     4. Language dropdown
     --------------------------------------------------------------------- */
  var langBtn = document.getElementById("langBtn");
  var langMenu = document.getElementById("langMenu");

  langBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = langMenu.classList.toggle("is-open");
    langBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  langMenu.querySelectorAll("button[data-lang]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyTranslations(btn.getAttribute("data-lang"));
      langMenu.classList.remove("is-open");
      langBtn.setAttribute("aria-expanded", "false");
    });
  });
  document.addEventListener("click", function (e) {
    if (!langMenu.contains(e.target) && e.target !== langBtn) {
      langMenu.classList.remove("is-open");
      langBtn.setAttribute("aria-expanded", "false");
    }
  });

  applyTranslations(currentLang);

  /* ---------------------------------------------------------------------
     5. Sticky header elevation on scroll
     --------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        header.style.boxShadow = window.scrollY > 8 ? "0 6px 16px rgba(21,34,56,0.08)" : "none";
        ticking = false;
      });
      ticking = true;
    }
  });

  /* ---------------------------------------------------------------------
     6. Scroll reveal (IntersectionObserver)
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------------------------------------------------------------------
     7. Ripple + tap-scale feedback on interactive elements
     --------------------------------------------------------------------- */
  function spawnRipple(target, x, y) {
    var rect = target.getBoundingClientRect();
    var ripple = document.createElement("span");
    var size = Math.max(rect.width, rect.height) * 1.6;
    ripple.style.position = "absolute";
    ripple.style.left = (x - rect.left - size / 2) + "px";
    ripple.style.top = (y - rect.top - size / 2) + "px";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.borderRadius = "50%";
    ripple.style.background = "rgba(245,239,226,0.45)";
    ripple.style.pointerEvents = "none";
    ripple.style.transform = "scale(0)";
    ripple.style.opacity = "1";
    var computed = getComputedStyle(target);
    if (computed.position === "static") target.style.position = "relative";
    target.style.overflow = "hidden";
    target.appendChild(ripple);
    var anim = ripple.animate(
      [
        { transform: "scale(0)", opacity: 1 },
        { transform: "scale(1)", opacity: 0 }
      ],
      { duration: 550, easing: "cubic-bezier(.22,.68,0,1.02)" }
    );
    anim.onfinish = function () { ripple.remove(); };
  }
  function addRipple(el) {
    el.addEventListener("pointerdown", function (e) {
      spawnRipple(el, e.clientX, e.clientY);
    });
  }
  document.querySelectorAll(".btn-dark, .nav-card, .gallery-add").forEach(addRipple);

  /* Subtle 3D tilt on nav cards for pointer devices */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = "translateY(-3px) rotateX(" + (-relY * 10) + "deg) rotateY(" + (relX * 10) + "deg)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     8. Generic modal open/close
     --------------------------------------------------------------------- */
  function openModal(modal) {
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(modal) {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ---------------------------------------------------------------------
     9. About modal + Profil Angkatan modal
     --------------------------------------------------------------------- */
  var aboutModal = document.getElementById("aboutModal");
  var aboutBtn = document.getElementById("aboutBtn");
  var aboutModalClose = document.getElementById("aboutModalClose");
  var profilModal = document.getElementById("profilModal");
  var profilBtn = document.getElementById("profilBtn");
  var profilModalClose = document.getElementById("profilModalClose");

  aboutBtn.addEventListener("click", function () { openModal(aboutModal); });
  aboutModalClose.addEventListener("click", function () { closeModal(aboutModal); });
  aboutModal.addEventListener("click", function (e) {
    if (e.target === aboutModal) closeModal(aboutModal);
  });

  profilBtn.addEventListener("click", function () { openModal(profilModal); });
  profilModalClose.addEventListener("click", function () { closeModal(profilModal); });
  profilModal.addEventListener("click", function (e) {
    if (e.target === profilModal) closeModal(profilModal);
  });

  /* ---------------------------------------------------------------------
     10. Passcode gate - requireCode() resolves true only after the
     correct code has been entered (cached in sessionStorage per tab)
     --------------------------------------------------------------------- */
  var passcodeModal = document.getElementById("passcodeModal");
  var passcodeInput = document.getElementById("passcodeInput");
  var passcodeError = document.getElementById("passcodeError");
  var passcodeSubmit = document.getElementById("passcodeSubmit");
  var passcodeCancel = document.getElementById("passcodeCancel");
  var passcodeClose = document.getElementById("passcodeClose");
  var passcodeResolve = null;

  var codeUnlocked = false;
  try { codeUnlocked = sessionStorage.getItem("mintaswa_unlocked") === "true"; } catch (err) {}

  function requireCode() {
    if (codeUnlocked) return Promise.resolve(true);
    passcodeInput.value = "";
    passcodeError.hidden = true;
    openModal(passcodeModal);
    setTimeout(function () { passcodeInput.focus(); }, 300);
    return new Promise(function (resolve) { passcodeResolve = resolve; });
  }
  function submitPasscode() {
    var val = passcodeInput.value.trim();
    if (val && val === PASSCODE) {
      codeUnlocked = true;
      try { sessionStorage.setItem("mintaswa_unlocked", "true"); } catch (err) {}
      closeModal(passcodeModal);
      if (passcodeResolve) { passcodeResolve(true); passcodeResolve = null; }
    } else {
      passcodeError.hidden = false;
      var card = passcodeModal.querySelector(".modal-card");
      card.classList.remove("is-shaking");
      void card.offsetWidth;
      card.classList.add("is-shaking");
      passcodeInput.value = "";
      passcodeInput.focus();
    }
  }
  function cancelPasscode() {
    closeModal(passcodeModal);
    if (passcodeResolve) { passcodeResolve(false); passcodeResolve = null; }
  }
  passcodeSubmit.addEventListener("click", submitPasscode);
  passcodeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); submitPasscode(); }
  });
  passcodeCancel.addEventListener("click", cancelPasscode);
  passcodeClose.addEventListener("click", cancelPasscode);
  passcodeModal.addEventListener("click", function (e) {
    if (e.target === passcodeModal) cancelPasscode();
  });

  /* ---------------------------------------------------------------------
     11. Confirm modal (used for delete confirmation)
     --------------------------------------------------------------------- */
  var confirmModal = document.getElementById("confirmModal");
  var confirmTitle = document.getElementById("confirmTitle");
  var confirmMessage = document.getElementById("confirmMessage");
  var confirmOk = document.getElementById("confirmOk");
  var confirmCancel = document.getElementById("confirmCancel");
  var confirmResolve = null;

  function openConfirm(title, message) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.disabled = true;
    confirmOk.classList.add("is-arming");
    openModal(confirmModal);
    setTimeout(function () {
      confirmOk.disabled = false;
      confirmOk.classList.remove("is-arming");
    }, 500);
    return new Promise(function (resolve) { confirmResolve = resolve; });
  }
  function closeConfirm(result) {
    closeModal(confirmModal);
    if (confirmResolve) { confirmResolve(result); confirmResolve = null; }
  }
  confirmOk.addEventListener("click", function () { closeConfirm(true); });
  confirmCancel.addEventListener("click", function () { closeConfirm(false); });
  confirmModal.addEventListener("click", function (e) {
    if (e.target === confirmModal) closeConfirm(false);
  });

  /* ---------------------------------------------------------------------
     12. Photo form modal (shared by upload + edit caption)
     --------------------------------------------------------------------- */
  var photoFormModal = document.getElementById("photoFormModal");
  var photoFormClose = document.getElementById("photoFormClose");
  var photoFormCancel = document.getElementById("photoFormCancel");
  var photoFormSubmit = document.getElementById("photoFormSubmit");
  var photoFormTitle = document.getElementById("photoFormTitle");
  var photoFormHint = document.getElementById("photoFormHint");
  var photoFormDropzone = document.getElementById("photoFormDropzone");
  var photoFormFile = document.getElementById("photoFormFile");
  var photoFormPreview = document.getElementById("photoFormPreview");
  var photoFormDropzoneLabel = document.getElementById("photoFormDropzoneLabel");
  var photoFormName = document.getElementById("photoFormName");
  var photoFormError = document.getElementById("photoFormError");
  var photoFormMode = "upload";
  var photoFormOnSubmit = null;

  function openPhotoForm(mode, initialName, onSubmit) {
    photoFormMode = mode;
    photoFormOnSubmit = onSubmit;
    photoFormError.hidden = true;
    photoFormName.value = initialName || "";
    photoFormFile.value = "";
    photoFormPreview.hidden = true;
    photoFormPreview.src = "";
    if (mode === "edit") {
      photoFormTitle.textContent = t("editphoto.title");
      photoFormHint.textContent = t("editphoto.hint");
      photoFormDropzone.hidden = true;
      photoFormName.hidden = false;
      photoFormSubmit.textContent = t("action.save");
    } else {
      photoFormTitle.textContent = t("upload.title");
      photoFormHint.textContent = t("upload.hint");
      photoFormDropzone.hidden = false;
      photoFormDropzoneLabel.hidden = false;
      photoFormDropzoneLabel.textContent = t("upload.choose");
      photoFormName.hidden = true;
      photoFormSubmit.textContent = t("upload.submit");
    }
    photoFormSubmit.disabled = false;
    photoFormCancel.disabled = false;
    openModal(photoFormModal);
    setTimeout(function () {
      if (mode === "edit") photoFormName.focus();
    }, 300);
  }
  function closePhotoForm() {
    closeModal(photoFormModal);
    photoFormOnSubmit = null;
  }
  function showPhotoFormError(msg) {
    photoFormError.textContent = msg;
    photoFormError.hidden = false;
  }
  function setPhotoFormLoading(loading) {
    photoFormSubmit.disabled = loading;
    photoFormCancel.disabled = loading;
    photoFormSubmit.textContent = loading ? t("action.saving") : (photoFormMode === "edit" ? t("action.save") : t("upload.submit"));
  }

  photoFormFile.addEventListener("change", function () {
    var file = photoFormFile.files && photoFormFile.files[0];
    if (!file) return;
    var url = URL.createObjectURL(file);
    photoFormPreview.src = url;
    photoFormPreview.hidden = false;
    photoFormDropzoneLabel.hidden = true;
  });

  photoFormSubmit.addEventListener("click", function () {
    photoFormError.hidden = true;
    if (photoFormMode === "upload") {
      var file = photoFormFile.files && photoFormFile.files[0];
      if (!file) { showPhotoFormError(t("upload.needphoto")); return; }
      runPhotoFormSubmit({ file: file });
    } else {
      var name = photoFormName.value.trim();
      if (!name) { showPhotoFormError(t("upload.needname")); return; }
      runPhotoFormSubmit({ name: name });
    }
  });
  function runPhotoFormSubmit(data) {
    if (!photoFormOnSubmit) return;
    setPhotoFormLoading(true);
    Promise.resolve(photoFormOnSubmit(data))
      .then(function () { closePhotoForm(); })
      .catch(function (err) {
        console.error("photo form submit error:", err);
        showPhotoFormError(photoFormMode === "edit" ? t("editphoto.error") : t("upload.uploaderror"));
      })
      .finally(function () { setPhotoFormLoading(false); });
  }
  photoFormName.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); photoFormSubmit.click(); }
  });
  photoFormCancel.addEventListener("click", closePhotoForm);
  photoFormClose.addEventListener("click", closePhotoForm);
  photoFormModal.addEventListener("click", function (e) {
    if (e.target === photoFormModal) closePhotoForm();
  });

  /* ---------------------------------------------------------------------
     13. Gallery: assets/ (GitHub, archive photos) + Supabase (uploader
     photos) merged together. Preview = up to 9 GitHub + up to 3 latest
     uploader photos (max 12). Full gallery modal shows everything.
     GitHub photos cannot be edited/deleted by visitors.
     --------------------------------------------------------------------- */
  var galleryGrid = document.getElementById("galleryGrid");
  var galleryEmpty = document.getElementById("galleryEmpty");
  var galleryAddBtn = document.getElementById("galleryAddBtn");
  var fullGalleryModal = document.getElementById("fullGalleryModal");
  var fullGalleryGrid = document.getElementById("fullGalleryGrid");
  var fullGalleryEmpty = document.getElementById("fullGalleryEmpty");
  var fullGalleryClose = document.getElementById("fullGalleryClose");
  var fullGalleryAddBtn = document.getElementById("fullGalleryAddBtn");
  var viewAllBtn = document.getElementById("viewAllBtn");
  var navManageGalleryBtn = document.getElementById("navManageGalleryBtn");

  var photosCache = []; // Supabase uploader photos, newest first
  var supabaseLoadError = false;

  function getPreviewAlbumPhotos() {
    return githubAlbumPhotos.slice(0, 9).concat(photosCache.slice(0, 3));
  }
  function getFullAlbumPhotos() {
    return githubAlbumPhotos.concat(photosCache);
  }

  async function fetchPhotos() {
    if (!sb) return null;
    try {
      var res = await sb.from("gallery_photos").select("*").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      return (res.data || []).map(function (p) { p.source = "supabase"; return p; });
    } catch (err) {
      console.error("fetchPhotos error:", err);
      return null;
    }
  }

  function extractStoragePath(url) {
    if (!url) return null;
    var marker = "/object/public/" + GALLERY_BUCKET + "/";
    var idx = url.indexOf(marker);
    if (idx === -1) return null;
    try { return decodeURIComponent(url.slice(idx + marker.length)); }
    catch (err) { return url.slice(idx + marker.length); }
  }

  function spawnHeartBurst(container, x, y) {
    if (getComputedStyle(container).position === "static") container.style.position = "relative";
    var heart = document.createElement("span");
    heart.className = "heart-burst";
    heart.textContent = "❤";
    heart.style.left = x + "px";
    heart.style.top = y + "px";
    container.appendChild(heart);
    setTimeout(function () { heart.remove(); }, 820);
  }

  function closeAllFgMenus() {
    document.querySelectorAll(".fg-menu.is-open").forEach(function (m) { m.classList.remove("is-open"); });
  }
  document.addEventListener("click", closeAllFgMenus);

  function createGalleryItemEl(photo) {
    var item = document.createElement("button");
    item.type = "button";
    item.className = "gallery-item pop-in";
    var img = document.createElement("img");
    img.src = photo.image_url;
    img.alt = photo.uploader_name ? ("Kenangan dari " + photo.uploader_name) : "Kenangan";
    img.loading = "lazy";
    img.addEventListener("error", function () { item.classList.add("img-missing"); });
    item.appendChild(img);
    addRipple(item);
    item.addEventListener("click", function () { openLightbox(photo); });
    return item;
  }

  function createFullGalleryItemEl(photo) {
    var item = document.createElement("div");
    item.className = "fg-item";

    var img = document.createElement("img");
    img.src = photo.image_url;
    img.alt = photo.uploader_name ? ("Kenangan dari " + photo.uploader_name) : "Kenangan";
    img.loading = "lazy";
    var clickTimer = null;
    img.addEventListener("click", function (e) {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        var rect = item.getBoundingClientRect();
        var x = (e.clientX != null ? e.clientX - rect.left : rect.width / 2);
        var y = (e.clientY != null ? e.clientY - rect.top : rect.height / 2);
        spawnHeartBurst(item, x, y);
      } else {
        clickTimer = setTimeout(function () {
          clickTimer = null;
          openLightbox(photo);
        }, 260);
      }
    });
    item.appendChild(img);

    if (photo.source !== "github") {
      var menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.className = "fg-menu-btn";
      menuBtn.setAttribute("aria-label", "Menu foto");
      menuBtn.innerHTML = "<span></span><span></span><span></span>";

      var menu = document.createElement("div");
      menu.className = "fg-menu";
      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" stroke="#152238" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg><span>' + t("action.editcaption") + '</span>';
      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "fg-delete";
      delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13" stroke="#b33d3d" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg><span>' + t("action.delete") + '</span>';
      menu.appendChild(editBtn);
      menu.appendChild(delBtn);

      menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var wasOpen = menu.classList.contains("is-open");
        closeAllFgMenus();
        if (!wasOpen) menu.classList.add("is-open");
      });
      editBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.classList.remove("is-open");
        handleEditPhoto(photo);
      });
      delBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.classList.remove("is-open");
        handleDeletePhoto(photo, item);
      });

      item.appendChild(menuBtn);
      item.appendChild(menu);
    }

    if (photo.uploader_name) {
      var cap = document.createElement("span");
      cap.className = "fg-caption";
      cap.textContent = photo.uploader_name;
      item.appendChild(cap);
    }
    return item;
  }

  function renderHomeGallery() {
    var preview = getPreviewAlbumPhotos();
    galleryGrid.innerHTML = "";
    if (!preview.length) {
      galleryGrid.hidden = true;
      galleryEmpty.hidden = false;
      galleryEmpty.textContent = supabaseLoadError ? t("gallery.loaderror") : t("gallery.empty");
      return;
    }
    galleryGrid.hidden = false;
    galleryEmpty.hidden = true;
    preview.forEach(function (photo) {
      galleryGrid.appendChild(createGalleryItemEl(photo));
    });
  }

  function renderFullGallery() {
    var all = getFullAlbumPhotos();
    fullGalleryGrid.innerHTML = "";
    if (!all.length) {
      fullGalleryGrid.hidden = true;
      fullGalleryEmpty.hidden = false;
      fullGalleryEmpty.textContent = supabaseLoadError ? t("gallery.loaderror") : t("gallery.empty");
      return;
    }
    fullGalleryGrid.hidden = false;
    fullGalleryEmpty.hidden = true;
    all.forEach(function (photo) {
      fullGalleryGrid.appendChild(createFullGalleryItemEl(photo));
    });
  }

  async function loadPhotos() {
    var photos = await fetchPhotos();
    photosCache = photos || [];
    supabaseLoadError = (photos === null);
    renderHomeGallery();
    if (fullGalleryModal.classList.contains("is-open")) renderFullGallery();
  }

  async function initAlbum() {
    var ghPromise = loadGithubAlbumPhotos();
    var photos = await fetchPhotos();
    photosCache = photos || [];
    supabaseLoadError = (photos === null);
    await ghPromise;
    renderHomeGallery();
  }

  function handleUploadPhoto() {
    requireCode().then(function (ok) {
      if (!ok) return;
      openPhotoForm("upload", "", async function (data) {
        if (!sb) throw new Error("no supabase client");
        var rawExt = (data.file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        var ext = rawExt || "jpg";
        var path = Date.now() + "_" + Math.random().toString(36).slice(2) + "." + ext;
        var upRes = await sb.storage.from(GALLERY_BUCKET).upload(path, data.file, { cacheControl: "3600", upsert: false });
        if (upRes.error) throw upRes.error;
        var pub = sb.storage.from(GALLERY_BUCKET).getPublicUrl(path);
        var publicUrl = pub && pub.data && pub.data.publicUrl;
        var insRes = await sb.from("gallery_photos").insert([{ image_url: publicUrl, uploader_name: null }]);
        if (insRes.error) throw insRes.error;
        showToast(t("toast.photoadded"));
        await loadPhotos();
      });
    });
  }

  function handleEditPhoto(photo) {
    requireCode().then(function (ok) {
      if (!ok) return;
      openPhotoForm("edit", photo.uploader_name || "", async function (data) {
        if (!sb) throw new Error("no supabase client");
        var updRes = await sb.from("gallery_photos").update({ uploader_name: data.name }).eq("id", photo.id);
        if (updRes.error) throw updRes.error;
        showToast(t("toast.captionupdated"));
        await loadPhotos();
      });
    });
  }

  function handleDeletePhoto(photo, itemEl) {
    requireCode().then(function (ok) {
      if (!ok) return;
      openConfirm(t("confirm.title"), t("confirm.message")).then(function (yes) {
        if (!yes) return;
        itemEl.classList.add("is-removing");
        (async function () {
          try {
            if (!sb) throw new Error("no supabase client");
            var path = extractStoragePath(photo.image_url);
            if (path) await sb.storage.from(GALLERY_BUCKET).remove([path]);
            var delRes = await sb.from("gallery_photos").delete().eq("id", photo.id);
            if (delRes.error) throw delRes.error;
            showToast(t("toast.photodeleted"));
            setTimeout(function () { loadPhotos(); }, 320);
          } catch (err) {
            console.error("delete photo error:", err);
            showToast(t("toast.deleteerror"));
            itemEl.classList.remove("is-removing");
          }
        })();
      });
    });
  }

  function openFullGallery() {
    renderFullGallery();
    openModal(fullGalleryModal);
    loadPhotos();
  }
  viewAllBtn.addEventListener("click", openFullGallery);
  fullGalleryClose.addEventListener("click", function () { closeModal(fullGalleryModal); });
  fullGalleryModal.addEventListener("click", function (e) {
    if (e.target === fullGalleryModal) closeModal(fullGalleryModal);
  });
  fullGalleryAddBtn.addEventListener("click", handleUploadPhoto);
  galleryAddBtn.addEventListener("click", handleUploadPhoto);
  addRipple(fullGalleryAddBtn);
  if (navManageGalleryBtn) {
    navManageGalleryBtn.addEventListener("click", function () {
      closeNav();
      setTimeout(openFullGallery, 250);
    });
  }

  function subscribeGalleryRealtime() {
    if (!sb || !sb.channel) return;
    try {
      sb.channel("public:gallery_photos")
        .on("postgres_changes", { event: "*", schema: "public", table: "gallery_photos" }, function () {
          loadPhotos();
        })
        .subscribe();
    } catch (err) {
      console.error("gallery realtime subscribe error:", err);
    }
  }

  /* ---------------------------------------------------------------------
     14. Lightbox: full-resolution photo viewer with pinch/double-tap/
     wheel zoom + pan, works for any photo set (album or school gallery)
     --------------------------------------------------------------------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCounter = document.getElementById("lightboxCounter");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var lightboxPhotos = [];
  var currentIndex = 0;

  var zoomScale = 1, panX = 0, panY = 0;
  function applyZoomTransform(animate) {
    lightboxImg.style.transition = animate ? "transform .25s ease" : "none";
    lightboxImg.style.transform = "translate(" + panX + "px, " + panY + "px) scale(" + zoomScale + ")";
    lightboxImg.classList.toggle("is-zoomed", zoomScale > 1.01);
  }
  function clampPan() {
    var maxOffset = (zoomScale - 1) * 170;
    panX = Math.max(-maxOffset, Math.min(maxOffset, panX));
    panY = Math.max(-maxOffset, Math.min(maxOffset, panY));
  }
  function resetZoom() {
    zoomScale = 1; panX = 0; panY = 0;
    applyZoomTransform(false);
  }

  function showPhoto(index) {
    if (!lightboxPhotos.length) return;
    currentIndex = (index + lightboxPhotos.length) % lightboxPhotos.length;
    var photo = lightboxPhotos[currentIndex];
    resetZoom();
    lightboxImg.src = photo.image_url;
    lightboxImg.alt = photo.uploader_name || "";
    lightboxCounter.textContent = t("lightbox.counter")
      .replace("{n}", currentIndex + 1)
      .replace("{total}", lightboxPhotos.length);
  }
  function openLightboxFromSet(list, index) {
    lightboxPhotos = list;
    showPhoto(index);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function openLightbox(photoOrIndex) {
    var full = getFullAlbumPhotos();
    if (typeof photoOrIndex === "number") {
      openLightboxFromSet(full, photoOrIndex);
      return;
    }
    var idx = full.findIndex(function (p) { return p.id === photoOrIndex.id; });
    openLightboxFromSet(full, idx >= 0 ? idx : 0);
  }
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    resetZoom();
  }
  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", function () { showPhoto(currentIndex - 1); });
  lightboxNext.addEventListener("click", function () { showPhoto(currentIndex + 1); });
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* Swipe to navigate (only when not zoomed in) */
  var touchStartX = 0;
  lightbox.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (zoomScale > 1.01) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) showPhoto(currentIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* Pinch-to-zoom + drag-to-pan */
  function touchDist(t1, t2) {
    var dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  var pinchStartDist = 0, pinchStartScale = 1;
  var isPanning = false, panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;

  lightboxImg.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
      pinchStartDist = touchDist(e.touches[0], e.touches[1]);
      pinchStartScale = zoomScale;
    } else if (e.touches.length === 1 && zoomScale > 1.01) {
      isPanning = true;
      lightboxImg.classList.add("is-panning");
      panStartX = e.touches[0].clientX;
      panStartY = e.touches[0].clientY;
      panOriginX = panX;
      panOriginY = panY;
    }
  }, { passive: true });
  lightboxImg.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var d = touchDist(e.touches[0], e.touches[1]);
      if (pinchStartDist > 0) {
        zoomScale = Math.max(1, Math.min(4, pinchStartScale * (d / pinchStartDist)));
        clampPan();
        applyZoomTransform(false);
      }
    } else if (e.touches.length === 1 && isPanning) {
      e.preventDefault();
      panX = panOriginX + (e.touches[0].clientX - panStartX);
      panY = panOriginY + (e.touches[0].clientY - panStartY);
      clampPan();
      applyZoomTransform(false);
    }
  }, { passive: false });
  lightboxImg.addEventListener("touchend", function () {
    isPanning = false;
    lightboxImg.classList.remove("is-panning");
    if (zoomScale < 1.05) resetZoom();
  });

  /* Double-tap / double-click to toggle zoom */
  var imgClickTimer = null;
  lightboxImg.addEventListener("click", function () {
    if (imgClickTimer) {
      clearTimeout(imgClickTimer);
      imgClickTimer = null;
      if (zoomScale > 1.01) {
        resetZoom();
      } else {
        zoomScale = 2.4; panX = 0; panY = 0;
        applyZoomTransform(true);
      }
    } else {
      imgClickTimer = setTimeout(function () { imgClickTimer = null; }, 280);
    }
  });

  /* Mouse-wheel zoom (desktop) */
  lightboxImg.addEventListener("wheel", function (e) {
    e.preventDefault();
    zoomScale = Math.max(1, Math.min(4, zoomScale + (e.deltaY < 0 ? 0.18 : -0.18)));
    clampPan();
    applyZoomTransform(false);
    if (zoomScale < 1.05) resetZoom();
  }, { passive: false });

  /* ---------------------------------------------------------------------
     14b. Mintaswa / school modal: assets2/ photos (all, discovered
     dynamically) + audio player + static staff roster
     --------------------------------------------------------------------- */
  var schoolModal = document.getElementById("schoolModal");
  var schoolModalClose = document.getElementById("schoolModalClose");
  var schoolGallery = document.getElementById("schoolGallery");
  var schoolAudioWrap = document.getElementById("schoolAudioWrap");
  var schoolAudio = document.getElementById("schoolAudio");
  var mintaswaViewAllBtn = document.getElementById("mintaswaViewAllBtn");

  var schoolPhotos = [];
  var schoolMediaLoaded = false;

  function renderSchoolGallery() {
    schoolGallery.innerHTML = "";
    if (!schoolPhotos.length) {
      var p = document.createElement("p");
      p.className = "school-gallery-empty";
      p.textContent = t("school.nophotos");
      schoolGallery.appendChild(p);
      return;
    }
    schoolPhotos.forEach(function (photo, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "school-gallery-item pop-in";
      var img = document.createElement("img");
      img.src = photo.image_url;
      img.alt = "Foto Mintaswa";
      img.loading = "lazy";
      btn.appendChild(img);
      addRipple(btn);
      btn.addEventListener("click", function () { openLightboxFromSet(schoolPhotos, i); });
      schoolGallery.appendChild(btn);
    });
  }

  async function loadSchoolMedia() {
    if (schoolMediaLoaded) return;
    schoolMediaLoaded = true;
    var items = await fetchGithubFolder(ASSETS2_PATH);
    var images = sortByNameAlpha(items.filter(function (it) { return it.type === "file" && isImageName(it.name); }));
    schoolPhotos = images.map(function (it) { return toGithubPhotoObj(it, ASSETS2_PATH); });
    renderSchoolGallery();

    var audioFile = items.find(function (it) { return it.type === "file" && isAudioName(it.name); });
    if (audioFile) {
      schoolAudio.src = ASSETS2_PATH + "/" + encodeURIComponent(audioFile.name);
      schoolAudioWrap.hidden = false;
    } else {
      schoolAudioWrap.hidden = true;
    }
  }
  function openSchoolModal() {
    openModal(schoolModal);
    loadSchoolMedia();
  }
  function closeSchoolModal() {
    closeModal(schoolModal);
    if (schoolAudio) schoolAudio.pause();
  }
  schoolModalClose.addEventListener("click", closeSchoolModal);
  schoolModal.addEventListener("click", function (e) { if (e.target === schoolModal) closeSchoolModal(); });
  if (mintaswaViewAllBtn) mintaswaViewAllBtn.addEventListener("click", openSchoolModal);

  /* ---------------------------------------------------------------------
     15. Messages: Supabase-backed guestbook feed (max 10, auto-trimmed)
     --------------------------------------------------------------------- */
  var pesanForm = document.getElementById("pesanForm");
  var pesanFeed = document.getElementById("pesanFeed");
  var pesanNama = document.getElementById("pesanNama");
  var pesanIsi = document.getElementById("pesanIsi");

  function renderMessages(messages, opts) {
    opts = opts || {};
    pesanFeed.innerHTML = "";
    if (!messages || !messages.length) {
      var p = document.createElement("p");
      p.className = "pesan-feed-empty";
      p.textContent = messages === null ? t("feed.loaderror") : t("feed.empty");
      pesanFeed.appendChild(p);
      return;
    }
    messages.forEach(function (msg, i) {
      var line = document.createElement("p");
      line.className = "pesan-line";
      if (opts.highlightLast && i === messages.length - 1) line.classList.add("is-new");
      var b = document.createElement("b");
      b.textContent = msg.name + ": ";
      line.appendChild(b);
      line.appendChild(document.createTextNode(msg.message));
      pesanFeed.appendChild(line);
    });
    pesanFeed.scrollTop = pesanFeed.scrollHeight;
  }

  async function fetchMessages() {
    if (!sb) return null;
    try {
      var res = await sb.from("message").select("*").order("created_at", { ascending: false }).limit(MAX_MESSAGES);
      if (res.error) throw res.error;
      return (res.data || []).slice().reverse();
    } catch (err) {
      console.error("fetchMessages error:", err);
      return null;
    }
  }
  async function loadMessages(opts) {
    var messages = await fetchMessages();
    renderMessages(messages, opts);
  }
  async function trimMessages() {
    if (!sb) return;
    try {
      var res = await sb.from("message").select("id, created_at").order("created_at", { ascending: false });
      if (res.error) throw res.error;
      var rows = res.data || [];
      if (rows.length > MAX_MESSAGES) {
        var idsToDelete = rows.slice(MAX_MESSAGES).map(function (r) { return r.id; });
        await sb.from("message").delete().in("id", idsToDelete);
      }
    } catch (err) {
      console.error("trimMessages error:", err);
    }
  }
  function subscribeMessagesRealtime() {
    if (!sb || !sb.channel) return;
    try {
      sb.channel("public:message")
        .on("postgres_changes", { event: "*", schema: "public", table: "message" }, function () {
          loadMessages({ highlightLast: true });
        })
        .subscribe();
    } catch (err) {
      console.error("message realtime subscribe error:", err);
    }
  }

  /* ---------------------------------------------------------------------
     16. Send Paper Planes: submit handler + plane/confetti burst
     --------------------------------------------------------------------- */
  var planeSVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M21 3L2 10.5l7 2.5m12-10L14 20l-2.5-7m9.5-10L11.5 13" stroke="#152238" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/></svg>';

  function launchPlanes(originEl) {
    var rect = originEl.getBoundingClientRect();
    var count = 5;
    for (var i = 0; i < count; i++) {
      (function (i) {
        var plane = document.createElement("div");
        plane.className = "sent-plane";
        plane.innerHTML = planeSVG;
        plane.style.left = (rect.left + rect.width / 2 - 13) + "px";
        plane.style.top = (rect.top + rect.height / 2 - 13) + "px";
        document.body.appendChild(plane);

        var spread = (i - (count - 1) / 2) * 70;
        var travel = window.innerHeight * 0.9;
        var rotateStart = -35 + spread / 4;
        var wobble = (i % 2 === 0 ? 1 : -1) * (6 + i * 2);

        var anim = plane.animate(
          [
            { transform: "translate(0, 0) rotate(" + rotateStart + "deg) scale(.6)", opacity: 0 },
            { transform: "translate(" + spread * 0.22 + "px, " + -travel * 0.16 + "px) rotate(" + (rotateStart - 5) + "deg) scale(1)", opacity: 1, offset: 0.14 },
            { transform: "translate(" + (spread * 0.55 + wobble) + "px, " + -travel * 0.5 + "px) rotate(" + (rotateStart - 12) + "deg) scale(.92)", opacity: 1, offset: 0.55 },
            { transform: "translate(" + (spread * 0.8) + "px, " + -travel * 0.78 + "px) rotate(" + (rotateStart - 18) + "deg) scale(.8)", opacity: .85, offset: 0.82 },
            { transform: "translate(" + spread + "px, " + -travel + "px) rotate(" + (rotateStart - 24) + "deg) scale(.65)", opacity: 0 }
          ],
          { duration: 2600 + i * 220, easing: "cubic-bezier(.4,.05,.3,1)", delay: i * 110, fill: "forwards" }
        );
        anim.onfinish = function () { plane.remove(); };
      })(i);
    }
  }

  function launchConfetti(originEl) {
    var rect = originEl.getBoundingClientRect();
    var colors = ["#4f9e94", "#e6b95c", "#a9d8f5", "#f5efe2", "#b33d3d"];
    for (var i = 0; i < 14; i++) {
      (function (i) {
        var dot = document.createElement("div");
        dot.className = "confetti-dot";
        dot.style.background = colors[i % colors.length];
        dot.style.left = (rect.left + rect.width / 2 - 4) + "px";
        dot.style.top = (rect.top + rect.height / 2 - 4) + "px";
        document.body.appendChild(dot);
        var angle = Math.random() * Math.PI * 2;
        var dist = 60 + Math.random() * 90;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist - 40;
        var anim = dot.animate(
          [
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            { transform: "translate(" + dx + "px," + dy + "px) scale(.4)", opacity: 0 }
          ],
          { duration: 700 + Math.random() * 400, easing: "cubic-bezier(.3,.6,.4,1)" }
        );
        anim.onfinish = function () { dot.remove(); };
      })(i);
    }
  }

  pesanForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = pesanNama.value.trim();
    var msg = pesanIsi.value.trim();
    if (!name || !msg) {
      showToast(t("toast.fillform"));
      return;
    }
    if (!sb) {
      showToast(t("toast.noconnection"));
      return;
    }
    var submitBtn = pesanForm.querySelector(".cta-title");
    submitBtn.disabled = true;
    sb.from("message").insert([{ name: name, message: msg }])
      .then(function (res) {
        if (res.error) throw res.error;
        launchPlanes(submitBtn);
        launchConfetti(submitBtn);
        showToast(t("toast.sent"));
        pesanForm.reset();
        return trimMessages();
      })
      .then(function () { return loadMessages({ highlightLast: true }); })
      .catch(function (err) {
        console.error("send message error:", err);
        showToast(t("toast.senderror"));
      })
      .finally(function () { submitBtn.disabled = false; });
  });

  /* ---------------------------------------------------------------------
     17. Ambient hero planes: randomize a fresh flight path each cycle
     --------------------------------------------------------------------- */
  var ambientPaths = [
    "M0,0 C40,-25 90,15 150,-35 C180,-60 210,-40 230,-70",
    "M0,0 C-30,25 -80,-10 -140,30 C-175,55 -200,35 -230,65",
    "M0,0 C35,20 75,-15 120,20 C150,45 180,25 210,55",
    "M0,0 C-40,-20 -85,15 -130,-25 C-160,-50 -195,-30 -220,-60"
  ];
  document.querySelectorAll(".plane").forEach(function (plane) {
    var speed = plane.getAttribute("data-speed");
    if (speed) plane.style.animationDuration = speed + "s";
    plane.addEventListener("animationiteration", function () {
      var path = ambientPaths[Math.floor(Math.random() * ambientPaths.length)];
      plane.style.offsetPath = "path('" + path + "')";
    });
  });

  /* ---------------------------------------------------------------------
     18. Global Escape key handling for whichever overlay is open
     --------------------------------------------------------------------- */
  document.addEventListener("keydown", function (e) {
    if (lightbox.classList.contains("is-open")) {
      if (e.key === "Escape") { closeLightbox(); return; }
      if (e.key === "ArrowLeft") { showPhoto(currentIndex - 1); return; }
      if (e.key === "ArrowRight") { showPhoto(currentIndex + 1); return; }
      return;
    }
    if (e.key !== "Escape") return;
    if (passcodeModal.classList.contains("is-open")) { cancelPasscode(); return; }
    if (photoFormModal.classList.contains("is-open")) { closePhotoForm(); return; }
    if (confirmModal.classList.contains("is-open")) { closeConfirm(false); return; }
    if (fullGalleryModal.classList.contains("is-open")) { closeModal(fullGalleryModal); return; }
    if (schoolModal.classList.contains("is-open")) { closeSchoolModal(); return; }
    if (aboutModal.classList.contains("is-open")) { closeModal(aboutModal); return; }
    if (profilModal.classList.contains("is-open")) { closeModal(profilModal); return; }
    if (mobileNav.classList.contains("is-open")) { closeNav(); return; }
  });

  /* ---------------------------------------------------------------------
     19. Initial data load
     --------------------------------------------------------------------- */
  initAlbum();
  loadMessages();
  subscribeGalleryRealtime();
  subscribeMessagesRealtime();

})();
