export default {
    template: `
      <div class="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div class="card shadow-lg p-4" style="width: 400px;">
          <div class="card-body">
            <h3 class="text-center mb-4 text-primary">Register</h3>
  
            <div class="mb-3">
              <label for="email" class="form-label">Email address</label>
              <input type="email" id="email" v-model="formData.email" class="form-control" placeholder="Enter your email">
            </div>
  
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" id="username" v-model="formData.username" class="form-control" placeholder="Enter your username">
            </div>
  
            <div class="mb-3">
              <label for="full_name" class="form-label">Full Name</label>
              <input type="text" id="full_name" v-model="formData.full_name" class="form-control" placeholder="Enter your full name">
            </div>
  
            <div class="mb-3">
              <label for="qualification" class="form-label">Qualification</label>
              <input type="text" id="qualification" v-model="formData.qualification" class="form-control" placeholder="Enter your qualification">
            </div>
  
            <div class="mb-3">
              <label for="dob" class="form-label">Date of Birth</label>
              <input type="date" id="dob" v-model="formData.dob" class="form-control" >

            </div>
  
            <div class="mb-3">
              <label for="pass" class="form-label">Password</label>
              <input type="password" id="pass" v-model="formData.password" class="form-control" placeholder="Enter your password">
            </div>
  
            <div class="d-grid">
              <button class="btn btn-primary" @click="addUser">Register</button>
            </div>
            <div >
              <p class="mt-3 text-center">Already have an account? <router-link to="/login">Login here</router-link></p>
            </div>
          </div>
        </div>
      </div>
    `,
    data: function () {
      return {
        formData: {
          email: "",
          password: "",
          username: "",
          full_name: "",
          qualification: "",
          dob: ""
        }
      };
    },
    methods: {
      addUser: function () {
        fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.formData)
        })
        .then(response => {
            return response.json().then(data => {
              if (response.ok) {
                alert(data.message);
                this.$router.push('/login');
              } else {
                alert(data.message);
                this.resetForm();
              }
            });
          })
        },
      resetForm: function () {
        this.formData = {
          email: "",
          password: "",
          username: "",
          full_name: "",
          qualification: "",
          dob: ""
        };
      }
    }
  }