// selly.js
const SELLY_API_URL = "https://selly-bot-production.up.railway.app/api/selly-chat";

document.addEventListener("DOMContentLoaded", function () {
  const productElement = document.getElementById("product");
  if (!productElement) return;

  const productId = productElement.getAttribute("data-product-id");
  const popup = document.getElementById("selly-popup");
  const popupText = document.getElementById("selly-popup-text");
  const btnYes = document.getElementById("selly-btn-yes");
  const btnNo = document.getElementById("selly-btn-no");

  const chat = document.getElementById("selly-chat");
  const chatMessages = document.getElementById("selly-chat-messages");
  const chatInput = document.getElementById("selly-chat-input");
  const chatSend = document.getElementById("selly-chat-send");
  const chatClose = document.getElementById("selly-chat-close");

  const VIEW_KEY = "sellmate_views_" + productId;
  const SHOWN_SESSION_KEY = "sellmate_popup_shown_" + productId;

  // Views hochzählen
  let views = parseInt(localStorage.getItem(VIEW_KEY) || "0", 10);
  views++;
  localStorage.setItem(VIEW_KEY, String(views));

  let popupTriggered = false;

  function showSellyPopup(reason) {
    if (sessionStorage.getItem(SHOWN_SESSION_KEY) === "1") return;
    if (popupTriggered) return;
    popupTriggered = true;

    if (reason === "revisit") {
      popupText.textContent =
        "Schön, dass du wieder bei diesem Artikel bist! 😊 Soll ich dir bei der Entscheidung helfen?";
    } else {
      popupText.textContent =
        "Hey, ich bin Selly 👋 Hast du Fragen zu diesem Produkt oder brauchst du Hilfe bei der Größe?";
    }

    popup.classList.remove("selly-hidden");
    sessionStorage.setItem(SHOWN_SESSION_KEY, "1");
  }

  // 30-Sekunden-Trigger
  const TIMEOUT_MS = 30000;
  let timeTimer = setTimeout(() => {
    showSellyPopup("time_on_page");
  }, TIMEOUT_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(timeTimer);
    } else if (!popupTriggered) {
      timeTimer = setTimeout(() => {
        showSellyPopup("time_on_page_resume");
      }, TIMEOUT_MS);
    }
  });

  // Revisit-Trigger
  if (views >= 2) {
    setTimeout(() => {
      showSellyPopup("revisit");
    }, 5000);
  }

  // Popup Buttons
  if (btnYes) {
    btnYes.addEventListener("click", () => {
      popup.classList.add("selly-hidden");
      openSellyChat(productId, views >= 2);
    });
  }

  if (btnNo) {
    btnNo.addEventListener("click", () => {
      popup.classList.add("selly-hidden");
    });
  }

  // Chat helper
  function addMessage(text, from = "selly") {
    const msg = document.createElement("div");
    msg.classList.add("selly-msg");
    if (from === "selly") {
      msg.classList.add("selly-msg-selly");
    } else {
      msg.classList.add("selly-msg-user");
    }
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function openSellyChat(productId, isRevisit) {
    chat.classList.remove("selly-hidden");
    chatMessages.innerHTML = "";

    if (isRevisit) {
      addMessage(
        "Schön, dass du wieder hier bist! 😊 Was möchtest du diesmal genauer wissen – eher Größe, Material oder passt das Teil zu deinem Style?"
      );
    } else {
      addMessage(
        "Hey, ich bin Selly 👋 Ich helfe dir gern bei diesem Produkt. Bist du unsicher bei der Größe, dem Material oder ob es zu dir passt?"
      );
    }
  }

  async function sendToSellyBackend(userText) {
    try {
      const response = await fetch(SELLY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          userMessage: userText,
          productData: {
            name: productElement.getAttribute("data-product-name") || null,
            category: productElement.getAttribute("data-product-category") || null,
            material: productElement.getAttribute("data-product-material") || null,
            fit: productElement.getAttribute("data-product-fit") || null,
          },
          isRevisit: views >= 2,
        }),
      });

      if (!response.ok) {
        console.error("Selly API error:", response.status);
        return "Gerade gibt es ein kleines technisches Problem. Versuch es bitte gleich nochmal. 🙈";
      }

      const data = await response.json();
      return (
        data.reply ||
        "Ich bin mir gerade unsicher – magst du deine Frage noch etwas genauer stellen?"
      );
    } catch (err) {
      console.error("Error talking to Selly API:", err);
      return "Ups, ich habe gerade keinen Zugriff auf meine Daten. Versuch es gleich nochmal. 🙈";
    }
  }

  async function handleUserMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, "user");
    chatInput.value = "";

    const replyText = await sendToSellyBackend(text);
    addMessage(replyText, "selly");
  }

  if (chatSend) {
    chatSend.addEventListener("click", handleUserMessage);
  }

  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUserMessage();
      }
    });
  }

  if (chatClose) {
    chatClose.addEventListener("click", () => {
      chat.classList.add("selly-hidden");
    });
  }
});
