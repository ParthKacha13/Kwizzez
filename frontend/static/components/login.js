export default {
    template: `
      <div class="row justify-content-center align-items-center" style="height: 725px; background-color: #f8f9fa;">
        
      <div class="col-md-4">
          <div class="border rounded p-4 shadow-sm bg-white">
            <h2 class="text-center mb-4">Login Form</h2>
            <p class="text-center text-danger">{{message}}</p>
            <div class="mb-3">
              <label for="email" class="form-label">Enter your email:</label>
              <input type="email" class="form-control" id="email" v-model="formData.email" placeholder="name@example.com">
            </div>    
            <div class="mb-3">
              <label for="password" class="form-label">Enter your password:</label>
              <input type="password" class="form-control" id="password" v-model="formData.password" placeholder="Password">
            </div>  
            <div class="d-grid">
              <button class="btn btn-primary" @click="loginUser">Login</button>
            </div>
            <div >
              <p class="mt-3 text-center">Don't have an account? <router-link to="/register">Register here</router-link></p>
            </div>
          </div>
        </div>
      </div>
    `,
    data: function () {
      return {
        formData: {
          email: "",
          password: ""
        },
        message: ""
      }
    },
    methods: {
      loginUser: function () {
        fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.formData)
        })
        .then(response => {
            return response.json().then(data => {
              if (response.ok) {
                localStorage.setItem("auth_token", data["auth-token"]);
                localStorage.setItem("id", data.id);
                localStorage.setItem("is_admin", data.is_admin ? "1" : "0");
                localStorage.setItem("username", data.username);
                if (data.is_admin) {
                  this.$router.push('/admin_dashboard');
                } else {
                  this.$router.push('/dashboard');
                }
              } else {
                this.message = data.message;
                this.resetForm();
              }
            });
          })
        },
      resetForm: function () {
        this.formData = {
          email: "",
          password: ""
        };
      }
    }
  }