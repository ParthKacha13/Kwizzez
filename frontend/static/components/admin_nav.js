export default {
    template: `
    <nav class="navbar navbar-expand-lg" style="background-color: #d3d3d3; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div class="container-fluid">
          <span class="navbar-brand">Kwizziz</span>
          <div class="collapse navbar-collapse">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item"><router-link class="nav-link" to="/admin_dashboard">Home</router-link></li>
              <li class="nav-item"><router-link class="nav-link" to="/admin_quiz">Quiz</router-link></li>
              <li class="nav-item"><router-link class="nav-link" to="/admin_summary">Summary</router-link></li>
              <a href="#" class="nav-link " @click.prevent="logout">Logout</a>
            </ul>
            <form class="d-flex">
          <input class="form-control me-4"
            type="search"
            placeholder="Search by subject or chapter..."
            v-model="searchInput"
            @input="updateSearch"
          >
        </form>
          </div>
        </div>
      </nav>
    `,data: function () {
        return {
            userData: {},
            searchInput: ''
        };
      },
      methods: {
        updateSearch() {
          this.$emit('search-change', this.searchInput);
        },
        logout() {
          if (confirm("Are you sure you want to logout?")) {
            fetch('/api/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authentication-Token': localStorage.getItem("auth_token")
              }
            })
            .then(response => response.json())
            .then(data => {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("id");
              localStorage.removeItem("is_admin");
              localStorage.removeItem("username");
    
              this.$router.push('/');
            })
            .catch(error => {
              console.error("Logout failed:", error);
              alert("Error while logging out!");
            });
          }
        }
      },
      mounted(){
        fetch('/api/home',{
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => this.userData = data)
        }
  }