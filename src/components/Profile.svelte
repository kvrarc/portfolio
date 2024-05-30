<section id="profile">
      <div class="section__pic-container">
        <!-- svelte-ignore a11y-img-redundant-alt -->
        <img src="./assets/profile.png" alt="Kaku profile picture" />
      </div>
      <div class="section__text">
        <p class="section__text__p1">Hello, I'm</p>
        <h1 class="title">Kaku</h1>
        <p class="section__text__p2">iOS & Android Developer</p>
        <div class="btn-container">
          <button
            class="btn btn-color-2"
            onclick=""
          >
            Download CV
          </button>
          <button class="btn btn-color-1" onclick="location.href='./#contact'">
            Contact Info
          </button>
        </div>
        <div id="socials-container">
          <img
            src="./assets/linkedin.png"
            alt="My LinkedIn profile"
            class="icon"
            onclick="window.open('https://linkedin.com/in/itsjustoku', '_blank')"
          />
          <img
            src="./assets/github.png"
            alt="My Github profile"
            class="icon"
            onclick="window.open('https://github.com/kvrarc', '_blank')"
          />
        </div>
      </div>
    </section>