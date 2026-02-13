export default {
    template: `
      <nav class="navbar navbar-expand-lg" style="background-color: #d3d3d3; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div class="container-fluid">
          <a class="navbar-brand fw-bold text-dark me-5" href="#">
            <i class="fas fa-graduation-cap me-2"></i>Kwizziz
          </a>
          <div class="collapse navbar-collapse">
            <ul class="navbar-nav d-flex flex-row gap-4">
              <li class="nav-item">
                <router-link class="nav-link text-dark" to="/">
                  <i class="fas fa-home me-1"></i>Home
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link text-dark" to="/login">
                  <i class="fas fa-sign-in-alt me-1"></i>Login
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="nav-link text-dark" to="/register">
                  <i class="fas fa-user-plus me-1"></i>Register
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `
  }
  