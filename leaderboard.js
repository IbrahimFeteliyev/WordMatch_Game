function goToMainMenu() {
    window.location.href = "index.html";
  }
  
  const data = JSON.parse(localStorage.getItem("wordMatchResults")) || [];
  
  // Convert time string (MM:SS) to seconds for comparison
  function timeToSeconds(timeStr) {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  }
  
  // Sort by score (descending) and then by time (ascending) if scores are equal
  const leaderboard = [...data]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return timeToSeconds(a.time) - timeToSeconds(b.time);
    })
    .slice(0, 5);
  
  const leaderboardList = document.getElementById("leaderboard-list");
  leaderboard.forEach((res, i) => {
    const li = document.createElement("div");
    li.className = "leaderboard-item";
    li.innerHTML = `
      <div class="rank">${i + 1}</div>
      <div class="player-info">
        <div class="player-name">${res.username}</div>
        <div class="player-stats">
          <span class="score"><i class="fas fa-star"></i> ${res.score} pts</span>
          <span class="time"><i class="fas fa-clock"></i> ${res.time}</span>
        </div>
      </div>
    `;
    leaderboardList.appendChild(li);
  });
  
  // 📈 Chart.js - Performance Over Time (for current user)
  const currentUser = data[data.length - 1]?.username;
  const userResults = data.filter(r => r.username === currentUser);
  const labels = userResults.map(r => {
    const date = new Date(r.date);
    return date.toLocaleDateString();
  });
  const scores = userResults.map(r => r.score);
  
  new Chart(document.getElementById("performanceChart"), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${currentUser}'s Score History`,
        data: scores,
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderColor: '#2563eb',
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
  