document.addEventListener("DOMContentLoaded", () => {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSy0s-xzYZetY0EVfqftVOGoolj2A_8IaV8-IoGKOxhK7MacUzbwftWEw_3VnvL2BijVJtD3bD7yTey/pub?output=csv"

  const landingPage = document.getElementById("landing-page")
  const membersPage = document.getElementById("members-page")
  const enterBtn = document.getElementById("enter-btn")
  const backToLandingBtn = document.getElementById("back-to-landing-btn")

  const thebossSection = document.getElementById("theboss-section")
  const kingsSection = document.getElementById("kings-section")
  const memberSection = document.getElementById("member-section")
  const thebossGrid = document.getElementById("theboss-grid")
  const kingsGrid = document.getElementById("kings-grid")
  const memberGrid = document.getElementById("member-grid")

  const searchInput = document.getElementById("searchInput")
  const prevBtn = document.getElementById("prevBtn")
  const nextBtn = document.getElementById("nextBtn")
  const pageInfo = document.getElementById("pageInfo")
  const paginationControls = document.querySelector(".pagination-controls")
  const audioPlayerContainer = document.getElementById("audio-player-container")
  const canvas = document.getElementById("canvas-bg")
  const ctx = canvas.getContext("2d")
  let particles = []

  // --- START: โค้ดควบคุมเพลง (ย้ายมาไว้ตรงนี้) ---
  const audio = document.getElementById("gang-music")
  const playPauseBtn = document.getElementById("play-pause-btn")
  const playIcon = playPauseBtn.querySelector("i")
  const muteBtn = document.getElementById("mute-btn")
  const muteIcon = muteBtn.querySelector("i")
  const volumeSlider = document.getElementById("volume-slider")

  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  })
  audio.addEventListener("play", () => {
    playIcon.className = "fas fa-pause"
  })
  audio.addEventListener("pause", () => {
    playIcon.className = "fas fa-play"
  })
  volumeSlider.addEventListener("input", (e) => {
    audio.volume = e.target.value
    audio.muted = false
  })
  audio.addEventListener("volumechange", () => {
    if (audio.muted || audio.volume === 0) {
      muteIcon.className = "fas fa-volume-xmark"
      volumeSlider.value = 0
    } else if (audio.volume < 0.5) {
      muteIcon.className = "fas fa-volume-low"
      volumeSlider.value = audio.volume
    } else {
      muteIcon.className = "fas fa-volume-high"
      volumeSlider.value = audio.volume
    }
  })
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted
  })
  // --- END: โค้ดควบคุมเพลง ---

  let allMembersData = [],
    thebossData = [],
    kingsData = [],
    memberData = []
  let paginatedMembers = []
  let currentPage = 1
  const itemsPerPage = 12

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
  }
//   window.addEventListener("resize", resizeCanvas)
//   resizeCanvas()

  class Particle {
    constructor(x, y) {
      this.x = x
      this.y = y
      this.size = Math.random() * 2 + 1
      this.speedX = Math.random() * 0.5 - 0.25
      this.speedY = Math.random() * 0.5 - 0.25
      this.color = "rgba(255, 255, 255, 0.6)"
    }
    update() {
      this.x += this.speedX
      this.y += this.speedY
      if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX
      if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY
    }
    draw() {
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function initParticles() {
    particles = []
    const n = (canvas.width * canvas.height) / 9000
    for (let i = 0; i < n; i++) {
      particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height))
    }
  }

  function connectParticles() {
    let opacityValue = 1
    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        const distance = (particles[a].x - particles[b].x) ** 2 + (particles[a].y - particles[b].y) ** 2
        if (distance < (canvas.width / 7) * (canvas.height / 7)) {
          opacityValue = 1 - distance / ((canvas.width / 7) * (canvas.height / 7))
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 0.3})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(particles[a].x, particles[a].y)
          ctx.lineTo(particles[b].x, particles[b].y)
          ctx.stroke()
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach((p) => {
      p.update()
      p.draw()
    })
    connectParticles()
    requestAnimationFrame(animateParticles)
  }
//   initParticles()
//   animateParticles()

  function createMemberCardHTML(member) {
    const { name = "", facebookLink = "#", role = "Member", pictureLink = "https://via.placeholder.com/150" } = member
    const roleClass = role.toLowerCase()
    const shortLink = facebookLink.replace(/^https?:\/\/(www\.)?facebook\.com\//, "")

    return `
            <div class="member-card ${roleClass}-card" style="--animation-delay: ${Math.random() * 0.5}s">
                <img src="${pictureLink}" alt="Profile Picture" class="profile-pic">
                <div class="member-info">
                    <h3>${name}</h3>
                    <a href="${facebookLink}" target="_blank">${shortLink}</a>
                </div>
                <a href="${facebookLink}" target="_blank" class="profile-link">
                    <i class="fab fa-facebook-f"></i>
                </a>
            </div>
        `
  }

  async function fetchAndDisplayMembers() {
    try {
      const response = await fetch(sheetUrl)
      if (!response.ok) throw new Error("Network response was not ok")
      const csvText = await response.text()

      const rows = csvText.trim().split(/\r?\n/)
      rows.shift()
      allMembersData = rows
        .map((row) => {
          const values = row.split(",")
          return {
            name: values[0]?.trim(),
            facebookLink: values[1]?.trim(),
            role: values[2]?.trim() || "Member",
            pictureLink: values[3]?.trim(),
          }
        })
        .filter((m) => m.name)

      thebossData = allMembersData.filter((m) => m.role === "Theboss")
      kingsData = allMembersData.filter((m) => m.role === "King")
      memberData = allMembersData.filter((m) => m.role !== "Theboss" && m.role !== "King")

      initializePageFunctionality()
    } catch (error) {
      console.error("Error fetching data:", error)
      memberGrid.innerHTML = "<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>"
    }
  }

  function initializePageFunctionality() {
    function renderCards(members, container) {
      container.innerHTML = members.map(createMemberCardHTML).join("")
    }

    function updateView() {
        const filterText = searchInput.value.toLowerCase();

        if (filterText) {
            // ค้นหาแยกในแต่ละ Role
            const filteredTheboss = thebossData.filter(m => m.name.toLowerCase().includes(filterText));
            const filteredKings = kingsData.filter(m => m.name.toLowerCase().includes(filterText));
            const filteredMembers = memberData.filter(m => m.name.toLowerCase().includes(filterText));

            // แสดงผลลัพธ์ใน Grid ของตัวเอง
            renderCards(filteredTheboss, thebossGrid);
            renderCards(filteredKings, kingsGrid);
            renderCards(filteredMembers, memberGrid);

            // แสดงหรือซ่อน Section ตามผลลัพธ์ที่เจอ
            thebossSection.style.display = filteredTheboss.length > 0 ? 'block' : 'none';
            kingsSection.style.display = filteredKings.length > 0 ? 'block' : 'none';
            memberSection.style.display = filteredMembers.length > 0 ? 'block' : 'none';

            // ซ่อนปุ่มเปลี่ยนหน้าตอนค้นหา
            paginationControls.style.display = 'none';

        } else {
            // โค้ดเดิมเมื่อไม่มีการค้นหา
            renderCards(thebossData, thebossGrid);
            renderCards(kingsData, kingsGrid);

            thebossSection.style.display = thebossData.length > 0 ? 'block' : 'none';
            kingsSection.style.display = kingsData.length > 0 ? 'block' : 'none';
            memberSection.style.display = 'block'; // ให้ section member แสดงเสมอในหน้าปกติ

            const totalPages = Math.ceil(memberData.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            paginatedMembers = memberData.slice(startIndex, startIndex + itemsPerPage);
            renderCards(paginatedMembers, memberGrid);

            if (totalPages > 1) {
                paginationControls.style.display = 'flex';
                pageInfo.textContent = `หน้า ${currentPage} จาก ${totalPages}`;
                prevBtn.disabled = (currentPage === 1);
                nextBtn.disabled = (currentPage === totalPages);
            } else {
                paginationControls.style.display = 'none';
            }
        }
    }
    
    searchInput.addEventListener("input", () => {
      currentPage = 1
      updateView()
    })
    nextBtn.addEventListener("click", () => {
      if (currentPage < Math.ceil(memberData.length / itemsPerPage)) {
        currentPage++
        updateView()
        window.scrollTo(0, memberSection.offsetTop)
      }
    })
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--
        updateView()
        window.scrollTo(0, memberSection.offsetTop)
      }
    })

    updateView()
  }

  enterBtn.addEventListener("click", () => {
    landingPage.style.display = "none"
    membersPage.style.display = "block"
    audioPlayerContainer.style.display = "flex"
    backToLandingBtn.style.display = "flex"
    currentPage = 1
    searchInput.value = ""
    audio.volume = 0.1 // แก้ไข: ไม่ต้องประกาศ audio ใหม่
    audio.play().catch((error) => {
      console.error("Autoplay prevented:", error)
    })
    fetchAndDisplayMembers()
  })

  backToLandingBtn.addEventListener("click", () => {
    window.location.reload()
  })

  if (window.location.hash === "#members") {
    enterBtn.click()
  }
})
