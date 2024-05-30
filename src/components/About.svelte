<section id="about">
  <p class="section__text__p1">Get To Know More</p>
  <h1 class="title">About Me</h1>
  <div class="section-container">
    <div class="section__pic-container">
      <!-- svelte-ignore a11y-img-redundant-alt -->
      <img
        src="./assets/about.png"
        alt="Profile picture"
        class="about-pic"
      />
    </div>
    <div class="about-details-container">
      <div class="about-containers">
        <div class="details-container">
          <img
            src="./assets/experience.png"
            alt="Experience icon"
            class="icon"
          />
          <h3>Experience</h3>
          <p>2+ years <br />Mobile App Development</p>
        </div>
        <div class="details-container">
          <img
            src="./assets/education.png"
            alt="Education icon"
            class="icon"
          />
          <h3>Education</h3>
          <p>Bachelor of Computer Applications</p>
        </div>
      </div>
      <div class="text-container">
        <p>
          Hey there! I'm Kaku Moni Baruah, a software developer based in Bangalore, India, with a knack for crafting iOS and Android applications. With extensive experience in iOS frameworks such as UIKit, Core Data, and SwiftUI, I thrive on creating seamless and intuitive user experiences for Apple devices. On the Android side, I'm well-versed in popular frameworks like Android Jetpack, Retrofit, and Dagger, ensuring robust and efficient app development.

Beyond coding, you'll often find me strumming away on my guitar or exploring the great outdoors through hiking and adventures.

This portfolio is a glimpse into my world of app development and creative pursuits. From sleek mobile interfaces to serene mountain vistas, I'm all about bringing ideas to life, both in the digital realm and beyond.

Thanks for stopping by, and feel free to reach out for a chat about apps, music, or anything in between!
        </p>
      </div>
    </div>
  </div>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <img
  src="./assets/arrow.png"
  alt="Arrow icon"
  class="icon arrow"
  on:click={() => {
    window.location.href = './#experience';
  }}
  />
</section>