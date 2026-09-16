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

  var daysWrap = document.querySelector(".avail-days");
  var slotsWrap = document.querySelector(".avail-slots");

  if (daysWrap && slotsWrap) {
    var DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var SLOT_TIMES = [
      { t: "8:00 AM", h: 8, m: 0 },
      { t: "9:30 AM", h: 9, m: 30 },
      { t: "11:00 AM", h: 11, m: 0 },
      { t: "12:30 PM", h: 12, m: 30 },
      { t: "2:00 PM", h: 14, m: 0 },
      { t: "3:30 PM", h: 15, m: 30 },
      { t: "5:00 PM", h: 17, m: 0 },
      { t: "6:30 PM", h: 18, m: 30 },
      { t: "8:00 PM", h: 20, m: 0 }
    ];

    var now = new Date();
    var monday = new Date(now);
    var dayNum = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - dayNum);
    monday.setHours(0, 0, 0, 0);

    var days = DAY_NAMES.map(function (name, i) {
      var d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { name: name, date: d, isToday: i === dayNum };
    });

    function pad(n) {
      return String(n).padStart(2, "0");
    }

    function renderSlots(selected) {
      slotsWrap.textContent = "";
      var dateStr = selected.date.getFullYear() + "-" + pad(selected.date.getMonth() + 1) + "-" + pad(selected.date.getDate());

      var open = SLOT_TIMES.filter(function (slot) {
        if (!selected.isToday) {
          return true;
        }
        return slot.h * 60 + slot.m > now.getHours() * 60 + now.getMinutes() + 60;
      });

      if (open.length === 0) {
        var none = document.createElement("p");
        none.className = "avail-empty";
        none.textContent = "No same-day slots left today — call or text (518) 430-6483.";
        slotsWrap.appendChild(none);
        return;
      }

      open.forEach(function (slot) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "avail-slot";
        btn.textContent = slot.t;
        btn.setAttribute("aria-label", slot.t + " on " + selected.name + " " + dateStr);
        btn.addEventListener("click", function () {
          var preferred = document.getElementById("preferred");
          if (preferred) {
            preferred.value = dateStr + "T" + pad(slot.h) + ":" + pad(slot.m);
          }
          document.getElementById("contact").scrollIntoView({ behavior: "smooth", block: "start" });
          window.setTimeout(function () {
            var field = document.getElementById("preferred");
            if (field) {
              field.focus({ preventScroll: true });
            }
          }, 700);
        });
        slotsWrap.appendChild(btn);
      });
    }

    days.forEach(function (day) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "avail-day";
      btn.setAttribute("role", "tab");
      btn.textContent = day.name;

      if (day.isToday) {
        var badge = document.createElement("span");
        badge.className = "avail-today";
        badge.textContent = "Same Day";
        btn.appendChild(badge);
      }

      btn.addEventListener("click", function () {
        daysWrap.querySelectorAll(".avail-day").forEach(function (el) {
          el.setAttribute("aria-selected", "false");
        });
        btn.setAttribute("aria-selected", "true");
        renderSlots(day);
      });

      daysWrap.appendChild(btn);
    });

    daysWrap.querySelector(".avail-day").setAttribute("aria-selected", "true");
    renderSlots(days[0]);
  }

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