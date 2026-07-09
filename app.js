document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // DOM ELEMENTS
  // ==========================================================================
  const form = document.getElementById('submission-form');
  const submitBtn = document.getElementById('submit-btn');
  
  const celebrationOverlay = document.getElementById('celebration-overlay');
  
  const adminTrigger = document.getElementById('admin-trigger');
  const adminOverlay = document.getElementById('admin-overlay');
  const closeAdminBtn = document.getElementById('close-admin-btn');
  const adminCount = document.getElementById('admin-count');
  const adminTableBody = document.getElementById('admin-table-body');
  
  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const resetDataBtn = document.getElementById('reset-data-btn');

  // Load submissions from LocalStorage
  let submissions = JSON.parse(localStorage.getItem('memo_submissions')) || [];

  // ==========================================================================
  // FORM SUBMISSION & CELEBRATION (Rickroll & Confetti)
  // ==========================================================================
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get input values
    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const nickname = document.getElementById('nickname').value.trim();

    // Create entry
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      firstname,
      lastname,
      nickname
    };

    // Save to array and local storage
    submissions.push(newEntry);
    localStorage.setItem('memo_submissions', JSON.stringify(submissions));

    // Send data to Google Sheets API (no-cors + URL-encoded for cross-domain compatibility)
    const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyMBGrWyahhACGdTURerLIo3Fvxop4TvLdYPf8qlRjjJGeN6CljQloT6YBxjsTHtfR34Q/exec";
    
    const formData = new URLSearchParams();
    formData.append("firstname", firstname);
    formData.append("lastname", lastname);
    formData.append("nickname", nickname);
    formData.append("date", newEntry.date);

    fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    })
    .then(() => {
      console.log("Données envoyées vers Google Sheets avec succès !");
    })
    .catch(error => {
      console.error("Erreur lors de l'envoi vers Google Sheets, sauvegarde locale active.", error);
    });

    // Trigger celebration effects
    triggerCelebration();

    // Reset Form
    form.reset();
  });

  function triggerCelebration() {
    // Show celebration overlay
    celebrationOverlay.classList.remove('hidden');
    celebrationOverlay.setAttribute('aria-hidden', 'false');

    // Confetti Fireworks (Multi-burst canvas confetti)
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1100 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Confetti burst left and right
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Initial big burst in center
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      zIndex: 1100
    });

    // Hide celebration overlay after 4.5 seconds
    setTimeout(() => {
      celebrationOverlay.classList.add('hidden');
      celebrationOverlay.setAttribute('aria-hidden', 'true');
    }, 4500);
  }

  // ==========================================================================
  // SECRET ADMIN PANEL
  // ==========================================================================
  
  // Double-click on "mémoire" in the footer opens the admin console
  adminTrigger.addEventListener('dblclick', () => {
    openAdminPanel();
  });

  function openAdminPanel() {
    updateAdminTable();
    adminOverlay.classList.remove('hidden');
    adminOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeAdminPanel() {
    adminOverlay.classList.add('hidden');
    adminOverlay.setAttribute('aria-hidden', 'true');
  }

  closeAdminBtn.addEventListener('click', closeAdminPanel);

  // Close overlay on click outside card
  adminOverlay.addEventListener('click', (e) => {
    if (e.target === adminOverlay) {
      closeAdminPanel();
    }
  });

  // Populate Admin Table with entries
  function updateAdminTable() {
    adminCount.textContent = submissions.length;
    adminTableBody.innerHTML = '';

    if (submissions.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Aucune donnée enregistrée pour le moment.</td>`;
      adminTableBody.appendChild(emptyRow);
      return;
    }

    // Sort submissions: newest first
    const sortedSubmissions = [...submissions].reverse();

    sortedSubmissions.forEach((entry) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.date}</td>
        <td>${escapeHtml(entry.firstname)}</td>
        <td>${escapeHtml(entry.lastname)}</td>
        <td>${escapeHtml(entry.nickname)}</td>
        <td>
          <button class="delete-row-btn" data-id="${entry.id}">Supprimer</button>
        </td>
      `;
      adminTableBody.appendChild(row);
    });

    // Add listeners to row delete buttons
    document.querySelectorAll('.delete-row-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idToDelete = parseInt(e.target.getAttribute('data-id'));
        deleteSubmission(idToDelete);
      });
    });
  }

  // Delete individual submission
  function deleteSubmission(id) {
    if (confirm("Supprimer ce contributeur de la liste ?")) {
      submissions = submissions.filter(s => s.id !== id);
      localStorage.setItem('memo_submissions', JSON.stringify(submissions));
      updateAdminTable();
    }
  }

  // Reset all submissions
  resetDataBtn.addEventListener('click', () => {
    if (confirm("⚠️ ATTENTION : Es-tu absolument sûr de vouloir réinitialiser TOUTES les inscriptions ? Cette action est irréversible.")) {
      submissions = [];
      localStorage.removeItem('memo_submissions');
      updateAdminTable();
    }
  });

  // ==========================================================================
  // DATA EXPORT (JSON & CSV)
  // ==========================================================================
  
  // Export JSON
  exportJsonBtn.addEventListener('click', () => {
    if (submissions.length === 0) return alert("Aucune donnée à exporter !");
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submissions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `remerciements_memoire_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    if (submissions.length === 0) return alert("Aucune donnée à exporter !");

    // CSV Headers
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for proper French accents encoding in Excel
    csvContent += "Date,Prénom,Nom,Surnom\n";

    // CSV Rows
    submissions.forEach(entry => {
      const row = [
        entry.date,
        escapeCsvField(entry.firstname),
        escapeCsvField(entry.lastname),
        escapeCsvField(entry.nickname)
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `remerciements_memoire_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Helper function to escape HTML special characters
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper function to format CSV fields (handle quotes and commas)
  function escapeCsvField(val) {
    let field = val.replace(/"/g, '""'); // Double double quotes to escape
    if (field.includes(",") || field.includes("\n") || field.includes('"')) {
      field = `"${field}"`;
    }
    return field;
  }
});
