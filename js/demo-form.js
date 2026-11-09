// RaccoonAI page script: Demo request form (all pages).
// One feature per file, so an error here cannot stop the others; js/core.js loads first and shares window.Raccoon.

(function (R) {
  "use strict";
  if (!R) { return; }

  /* ---------- Demo request form ---------- */
  var form = document.getElementById("demo-form");
  if (form) {
    var submit = document.getElementById("f-submit");
    var status = document.getElementById("form-status");
    var FORM_NOT_CONNECTED = /FORM_ID$/.test(form.action);

    /* Contact details. Leave a value empty until it is real: empty values stay hidden on the page and out of messages.
       When an email is set, a request that cannot be sent is offered as a prefilled letter instead. */
    var CONTACT = { phone: "", email: "" };

    var contactList = document.querySelector(".contacts");
    if (contactList) {
      var shown = 0;
      [["phone", "tel:" + CONTACT.phone.replace(/[^\d+]/g, "")], ["email", "mailto:" + CONTACT.email]].forEach(function (c) {
        var row = contactList.querySelector('[data-contact="' + c[0] + '"]');
        if (!row || !CONTACT[c[0]]) { return; }
        var a = row.querySelector("a");
        a.href = c[1];
        a.textContent = CONTACT[c[0]];
        row.hidden = false;
        shown++;
      });
      contactList.hidden = shown === 0;
    }

    function escHtml(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }

    // What the visitor can do when the request does not go through; never cites a contact that does not exist yet.
    function fallbackHtml() {
      var ways = [];
      if (CONTACT.email) {
        var f = form.elements;
        var body = ["Имя: " + f.name.value, "Компания: " + f.company.value, "Телефон: " + f.phone.value, f.email.value ? "Почта: " + f.email.value : ""].filter(Boolean).join("\n");
        ways.push('<a href="mailto:' + escHtml(CONTACT.email) + "?subject=" + encodeURIComponent("Запрос демо RaccoonAI") + "&body=" + encodeURIComponent(body) + '">отправьте заявку письмом</a>');
      }
      if (CONTACT.phone) { ways.push('позвоните: <a href="tel:' + escHtml(CONTACT.phone.replace(/[^\d+]/g, "")) + '">' + escHtml(CONTACT.phone) + "</a>"); }
      return ways.length ? " Или " + ways.join(", или ") + "." : "";
    }

    var rules = {
      name: function (v) { return v.trim().length > 0; },
      company: function (v) { return v.trim().length > 0; },
      phone: function (v) { return v.replace(/\D/g, "").length >= 10; },
      email: function (v) { return v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
    };

    function validateField(input) {
      var rule = rules[input.name];
      if (!rule) { return true; }
      var ok = rule(input.value);
      var field = input.closest(".field");
      field.classList.toggle("is-invalid", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      var err = field.querySelector(".field-error");
      if (err) {
        if (ok) { input.removeAttribute("aria-describedby"); }
        else { input.setAttribute("aria-describedby", err.id); }
      }
      return ok;
    }

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      input.addEventListener("blur", function () { if (input.value) { validateField(input); } });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("is-invalid")) { validateField(input); }
      });
    });

    function showStatus(kind, html) {
      status.className = "form-status is-" + kind;
      status.innerHTML = html;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (name) {
        var input = form.elements[name];
        if (!validateField(input) && !firstBad) { firstBad = input; }
      });
      if (firstBad) { firstBad.focus(); return; }

      if (FORM_NOT_CONNECTED) {
        showStatus("error", "Заявку не удалось отправить: форма ещё не подключена. Введённые данные сохранены." + fallbackHtml());
        return;
      }

      submit.disabled = true;
      submit.textContent = "Отправляем…";
      status.className = "form-status";
      status.textContent = "";

      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) { throw new Error("HTTP " + res.status); }
          form.reset();
          showStatus("success", "<strong>Заявка отправлена.</strong> Мы свяжемся с вами, чтобы договориться о демо.");
        })
        .catch(function () {
          showStatus("error", "Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз, введённые данные сохранены." + fallbackHtml());
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = "Запросить демо";
        });
    });
  }
})(window.Raccoon);
