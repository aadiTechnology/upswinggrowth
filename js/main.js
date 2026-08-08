/**
 * Upswing Growth — Global JavaScript
 * Mobile nav, sticky header, Lucide icons, FAQ, form, counters, section reveals.
 */
(function () {
  "use strict";

  const prefersReducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const mobileLinks = mobileNav ? mobileNav.querySelectorAll("a") : [];

  function setNavOpen(isOpen) {
    if (!navToggle || !mobileNav) return;

    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    mobileNav.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);

    if (isOpen) {
      mobileNav.removeAttribute("hidden");
      const firstLink = mobileNav.querySelector("a");
      if (firstLink) firstLink.focus();
    } else {
      mobileNav.setAttribute("hidden", "");
    }
  }

  function closeNav() {
    setNavOpen(false);
  }

  function initNav() {
    if (!navToggle || !mobileNav) return;

    setNavOpen(false);

    navToggle.addEventListener("click", function () {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      setNavOpen(!expanded);
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (header && !header.contains(target)) {
        closeNav();
      }
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        closeNav();
      }
    });
  }

  function initHeaderScroll() {
    if (!header) return;

    let ticking = false;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  function initIcons() {
    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }

  function initCurrentYear() {
    const yearEl = document.querySelector("[data-year]");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function formatCount(value) {
    return Math.round(value).toLocaleString("en-US");
  }

  function animateCount(el, target, duration) {
    const suffix = el.getAttribute("data-count-suffix") || "";
    const prefix = el.getAttribute("data-count-prefix") || "";

    if (prefersReducedMotion() || duration <= 0) {
      el.textContent = prefix + formatCount(target) + suffix;
      return;
    }

    const start = performance.now();
    const from = 0;

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      el.textContent = prefix + formatCount(current) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(frame);
      } else {
        el.textContent = prefix + formatCount(target) + suffix;
      }
    }

    window.requestAnimationFrame(frame);
  }

  /**
   * Animated counters — run once when stats grid enters viewport.
   */
  function initCounters() {
    const root = document.querySelector("[data-counters]");
    if (!root) return;

    const nodes = root.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    let started = false;

    function run() {
      if (started) return;
      started = true;
      nodes.forEach(function (el) {
        const target = parseFloat(el.getAttribute("data-count") || "0");
        if (Number.isNaN(target)) return;
        animateCount(el, target, 1600);
      });
    }

    function isInView(el) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < vh * 0.9 && rect.bottom > vh * 0.1;
    }

    if (isInView(root)) {
      run();
      return;
    }

    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            run();
            observer.disconnect();
            window.removeEventListener("scroll", onScroll);
          }
        });
      },
      { threshold: [0, 0.15, 0.35], rootMargin: "0px 0px -5% 0px" }
    );

    function onScroll() {
      if (isInView(root)) {
        run();
        observer.disconnect();
        window.removeEventListener("scroll", onScroll);
      }
    }

    observer.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /**
   * Section reveal on scroll (Intersection Observer).
   */
  function initReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function setFieldError(form, name, message) {
    const input = form.querySelector('[name="' + name + '"]');
    const error = form.querySelector('[data-error-for="' + name + '"]');
    if (input) {
      input.classList.toggle("is-invalid", Boolean(message));
      input.classList.toggle("is-valid", !message && input.value.trim().length > 0);
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }
    if (error) {
      if (message) {
        error.hidden = false;
        error.textContent = message;
      } else {
        error.hidden = true;
        error.textContent = "";
      }
    }
  }

  function validateField(input) {
    const name = input.getAttribute("name") || "";
    const value = (input.value || "").trim();
    const isRequired = input.hasAttribute("required");

    if (!isRequired && !value) {
      return "";
    }

    if (isRequired && !value) {
      return "This field is required.";
    }

    if (name === "name" || name === "business") {
      if (value.length < 2) {
        return "Please enter at least 2 characters.";
      }
    }

    if (name === "email" || input.type === "email") {
      if (!isValidEmail(value)) {
        return "Please enter a valid work email.";
      }
    }

    if (name === "message" && value.length > 800) {
      return "Please keep this under 800 characters.";
    }

    return "";
  }

  function setLoading(form, isLoading) {
    const submit = form.querySelector("[data-form-submit]");
    const label = form.querySelector("[data-submit-label]");
    const loader = form.querySelector("[data-submit-loader]");
    const icon = form.querySelector("[data-submit-icon]");

    if (submit) {
      submit.disabled = isLoading;
      submit.classList.toggle("is-loading", isLoading);
      submit.setAttribute("aria-busy", String(isLoading));
    }
    if (label) {
      label.hidden = isLoading;
    }
    if (loader) {
      if (isLoading) {
        loader.hidden = false;
      } else {
        loader.hidden = true;
      }
    }
    if (icon) {
      icon.hidden = isLoading;
    }
  }

  /**
   * Strategy form — client validation, loading, success.
   */
  function initStrategyForm() {
    const form = document.querySelector("[data-strategy-form]") || document.querySelector("#strategy-request");
    if (!form) return;

    const status = form.querySelector("[data-form-status]");
    const success = form.querySelector("[data-form-success]");
    const fields = form.querySelectorAll("[data-validate], input[required], textarea[data-validate]");

    fields.forEach(function (input) {
      input.addEventListener("blur", function () {
        const message = validateField(input);
        setFieldError(form, input.getAttribute("name") || "", message);
      });

      input.addEventListener("input", function () {
        if (input.classList.contains("is-invalid")) {
          const message = validateField(input);
          setFieldError(form, input.getAttribute("name") || "", message);
        }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      let firstInvalid = null;
      let valid = true;

      fields.forEach(function (input) {
        const message = validateField(input);
        setFieldError(form, input.getAttribute("name") || "", message);
        if (message) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        if (status) {
          status.hidden = false;
          status.classList.add("is-visible");
          status.textContent = "Please correct the highlighted fields and try again.";
        }
        return;
      }

      if (status) {
        status.hidden = true;
        status.classList.remove("is-visible");
        status.textContent = "";
      }

      setLoading(form, true);

      window.setTimeout(function () {
        setLoading(form, false);
        form.classList.add("is-success");
        form.reset();

        fields.forEach(function (input) {
          input.classList.remove("is-invalid", "is-valid");
          input.removeAttribute("aria-invalid");
          setFieldError(form, input.getAttribute("name") || "", "");
        });

        if (success) {
          success.hidden = false;
        }

        if (status) {
          status.hidden = true;
        }

        initIcons();
      }, prefersReducedMotion() ? 0 : 900);
    });
  }

  /**
   * Accessible FAQ accordion — one panel open at a time, keyboard friendly.
   */
  function initFaq() {
    const root = document.querySelector("[data-faq]");
    if (!root) return;

    const items = Array.prototype.slice.call(root.querySelectorAll(".faq__item"));

    function setOpen(item, open) {
      const trigger = item.querySelector("[data-faq-trigger]");
      const panel = item.querySelector("[data-faq-panel]");
      if (!trigger || !panel) return;

      const reduce = prefersReducedMotion();

      trigger.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);

      if (open) {
        panel.hidden = false;
        if (reduce) {
          panel.classList.add("is-open");
        } else {
          window.requestAnimationFrame(function () {
            panel.classList.add("is-open");
          });
        }
      } else {
        panel.classList.remove("is-open");
        if (reduce) {
          panel.hidden = true;
        } else {
          window.setTimeout(function () {
            if (trigger.getAttribute("aria-expanded") !== "true") {
              panel.hidden = true;
            }
          }, 320);
        }
      }
    }

    function closeOthers(except) {
      items.forEach(function (item) {
        if (item !== except) setOpen(item, false);
      });
    }

    items.forEach(function (item) {
      const trigger = item.querySelector("[data-faq-trigger]");
      if (!trigger) return;

      trigger.addEventListener("click", function () {
        const expanded = trigger.getAttribute("aria-expanded") === "true";
        if (expanded) {
          setOpen(item, false);
        } else {
          closeOthers(item);
          setOpen(item, true);
        }
      });

      trigger.addEventListener("keydown", function (event) {
        const triggers = items
          .map(function (el) {
            return el.querySelector("[data-faq-trigger]");
          })
          .filter(Boolean);
        const index = triggers.indexOf(trigger);
        if (index < 0) return;

        let nextIndex = null;

        if (event.key === "ArrowDown") {
          nextIndex = (index + 1) % triggers.length;
        } else if (event.key === "ArrowUp") {
          nextIndex = (index - 1 + triggers.length) % triggers.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = triggers.length - 1;
        }

        if (nextIndex !== null) {
          event.preventDefault();
          triggers[nextIndex].focus();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initHeaderScroll();
    initIcons();
    initCurrentYear();
    initStrategyForm();
    initFaq();
    initCounters();
    initReveal();
  });
})();
