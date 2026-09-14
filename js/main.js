(function () {
  "use strict";

  var header = document.querySelector("[data-header]");
  var toggle = header.querySelector(".nav-toggle");

  function setOpen(open) {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("nav-open"));
  });

  header.querySelectorAll(".site-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.getElementById("year").textContent = String(new Date().getFullYear());

  var slides = document.querySelectorAll(".why-gallery .slide");
  if (slides.length > 1) {
    var current = 0;
    var fadeMs = 600;
    window.setInterval(function () {
      slides[current].classList.remove("active");
      window.setTimeout(function () {
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
      }, fadeMs);
    }, 3000);
  }

  var serviceSelect = document.getElementById("service");
  var contact = document.getElementById("contact");

  document.querySelectorAll("[data-service]").forEach(function (card) {
    card.addEventListener("click", function () {
      var value = card.getAttribute("data-service");
      if (serviceSelect.querySelector('option[value="' + value + '"]')) {
        serviceSelect.value = value;
      }
      contact.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(function () {
        serviceSelect.focus({ preventScroll: true });
      }, 700);
    });
  });

  var form = document.getElementById("lead-form");
  var result = document.getElementById("form-result");
  var submitBtn = form.querySelector('button[type="submit"]');

  function showResult(type, message) {
    result.textContent = message;
    result.className = "form-result " + type;
    result.hidden = false;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (window.location.protocol === "file:") {
      showResult(
        "error",
        "Open the site via http://localhost/notery/ — the form needs a server, not a file link."
      );
      return;
    }

    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = value;
    });

    var original = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var controller = new AbortController();
    var timeout = window.setTimeout(function () {
      controller.abort();
    }, 15000);

    let json = null;
    try {
      const res = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data),
        signal: controller.signal
      });
      try {
        json = await res.json();
      } catch (e) {
        json = null;
      }
      if (res.ok && json && json.success) {
        showResult("success", json.message);
        openSuccessModal();
        form.reset();
      } else {
        showResult(
          "error",
          json && json.message ? json.message : "Could not submit — please call (518) 430-6483."
        );
      }
    } catch (e) {
      showResult(
        "error",
        e.name === "AbortError"
          ? "Request timed out — please call (518) 430-6483."
          : "Could not reach the server — please call (518) 430-6483."
      );
    } finally {
      window.clearTimeout(timeout);
      submitBtn.disabled = false;
      submitBtn.textContent = original;
    }
  });

  var callModal = document.getElementById("call-modal");
  var callModalFocus = null;

  function openCallModal(trigger) {
    callModalFocus = trigger;
    callModal.hidden = false;
    document.body.classList.add("modal-open");
    callModal.querySelector(".call-modal-close").focus();
  }

  function closeCallModal() {
    callModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (callModalFocus) {
      callModalFocus.focus();
      callModalFocus = null;
    }
  }

  var successModal = document.getElementById("success-modal");
  var successModalFocus = null;

  function openSuccessModal() {
    successModalFocus = document.activeElement;
    successModal.hidden = false;
    document.body.classList.add("modal-open");
    successModal.querySelector(".call-modal-close").focus();
  }

  function closeSuccessModal() {
    successModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (successModalFocus) {
      successModalFocus.focus();
      successModalFocus = null;
    }
  }

  document.querySelectorAll(".call-now").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      openCallModal(link);
    });
  });

  callModal.querySelectorAll("[data-call-close]").forEach(function (el) {
    el.addEventListener("click", closeCallModal);
  });

  successModal.querySelectorAll("[data-success-close]").forEach(function (el) {
    el.addEventListener("click", closeSuccessModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (!callModal.hidden) {
        closeCallModal();
      } else if (!successModal.hidden) {
        closeSuccessModal();
      }
    }
  });

  document.documentElement.classList.add("js");

  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObs.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }
})();