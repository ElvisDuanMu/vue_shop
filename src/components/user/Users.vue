<template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/welcome' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>用户管理</el-breadcrumb-item>
      <el-breadcrumb-item>用户列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!--卡片视图区域-->
    <el-card>
      <!-- 搜索与添加区域 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input placeholder="请输入内容" v-model="queryInfo.query" clearable @clear="getUserList" @change="getInputChange">
            <el-button slot="append" icon="el-icon-search" @click="getUserList"></el-button>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="addDialogVisible = true">添加用户</el-button>
        </el-col>
      </el-row>
      <!-- 用户列表区域 -->
      <el-table :data="userList" border stripe>
        <el-table-column type="index"/>
        <el-table-column label="姓名" prop="username"/>
        <el-table-column label="邮箱" prop="email"/>
        <el-table-column label="电话" prop="mobile"/>
        <el-table-column label="角色" prop="role_name"/>
        <el-table-column label="状态" >
          <!--作用域插槽新写法 等价于 slot-scope="scope" -->
          <template v-slot:default="scope">
            <el-switch
              v-model="scope.row.mg_state"
              active-color="#13ce66"
              inactive-color="#ff4949"
              @change="userStateChange(scope.row)">
            </el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180px">
          <template v-slot:default="scope">
            <!-- 修改按钮 -->
            <el-button type="primary" icon="el-icon-edit" size="mini" @click="showEditDialog(scope.row.id)"/>
            <!-- 删除按钮 -->
            <el-button type="danger" icon="el-icon-delete" size="mini" @click="removeUserById(scope.row.id)"/>
            <!-- 分配角色按钮 -->
            <el-tooltip class="item" effect="dark" content="分配角色" placement="top" :enterable="false">
              <el-button type="warning" icon="el-icon-setting" size="mini"/>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页区域 -->
      <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="queryInfo.pagenum"
          :page-sizes="[2, 5, 10, 20]"
          :page-size="queryInfo.pagesize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
      </el-pagination>
    </el-card>
    <!-- 添加用户弹出层区域 -->
    <el-dialog
      title="添加用户"
      :visible.sync="addDialogVisible"
      width="50%"
      :close-on-click-modal="false"
      :show-close="false"
      @close="addDialogClose">
      <!-- 内容主体区域 -->
      <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="70px" >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addForm.password" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addForm.email" />
        </el-form-item>
        <el-form-item label="手机" prop="mobile">
          <el-input v-model="addForm.mobile" />
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addUser">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 修改用户的弹出层区域 -->
    <el-dialog
      title="修改用户信息"
      :visible.sync="updateDialogVisible"
      width="50%"
      :close-on-click-modal="false"
      :show-close="false"
      @close="editDialogClosed" >
      <!-- 内容主体区域 -->
      <el-form :model="editForm" :rules="editFormRules" ref="editFormRef" label-width="70px" >
        <el-form-item label="用户名" >
          <el-input v-model="editForm.username" disabled/>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机" prop="mobile">
          <el-input v-model="editForm.mobile" />
        </el-form-item>
      </el-form>
      <!-- 底部区域 -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="updateDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editUserInfo">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'Users',
  data() {
    // 验证邮箱的校验规则
    const checkEmail = (rule, value, callback) => {
      // 验证邮箱的正则表达式
      const regEmail = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
      if (regEmail.test(value)) {
        // 合法邮箱
        return callback()
      } else {
        callback(new Error('请输入合法的邮箱'))
      }
    }
    // 验证手机号的校验规则
    const checkMobile = (rule, value, callback) => {
      // 验证手机号的正则表达式
      const regMobile = /^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/
      if (regMobile.test(value)) {
        // 合法手机号
        return callback()
      } else {
        callback(new Error('请输入合法的手机号'))
      }
    }
    return {
      // 获取用户列表的参数对象
      queryInfo: {
        query: '',
        // 当前的页数
        pagenum: 1,
        // 当前每页显示多少条数据
        pagesize: 2
      },
      userList: [],
      total: 0,
      // 判断输入框内容是否修改
      inputStatus: false,
      // 控制添加用户弹出层的显示与隐藏
      addDialogVisible: false,
      // 添加用户的表单数据
      addForm: {
        username: '',
        password: '',
        email: '',
        mobile: ''
      },
      // 添加表单的验证规则对象
      addFormRules: {
        username: [
          {
            required: true,
            message: '请输入用户名',
            trigger: 'blur'
          },
          {
            min: 3,
            max: 10,
            message: '用户名长度在 3 到 10 个字符',
            trigger: 'blur'
          }
        ],
        password: [
          {
            required: true,
            message: '请输入密码',
            trigger: 'blur'
          },
          {
            min: 3,
            max: 10,
            message: '密码长度在 6 到 15 个字符',
            trigger: 'blur'
          }
        ],
        email: [
          {
            required: true,
            message: '请输入邮箱',
            trigger: 'blur'
          },
          {
            validator: checkEmail,
            trigger: 'blur'
          }
        ],
        mobile: [
          {
            required: true,
            message: '请输入手机号',
            trigger: 'blur'
          },
          {
            validator: checkMobile,
            trigger: 'blur'
          }
        ]
      },
      // 控制修改用户弹出层的显示与隐藏
      updateDialogVisible: false,
      // 查询到用户信息对象
      editForm: {},
      // 修改表单的验证规则对象
      editFormRules: {
        email: [
          {
            required: true,
            message: '请输入邮箱',
            trigger: 'blur'
          },
          {
            validator: checkEmail,
            trigger: 'blur'
          }
        ],
        mobile: [
          {
            required: true,
            message: '请输入手机号',
            trigger: 'blur'
          },
          {
            validator: checkMobile,
            trigger: 'blur'
          }
        ]
      },
      // 删除数据标记
      deleteFlag: false
    }
  },
  created () {
    this.getUserList()
  },
  methods: {
    async getUserList() {
      // 如果输入框改变则说明查询的内容变了，需要重置到第一页
      if (this.inputStatus === true) {
        this.queryInfo.pagenum = 1
        // 重置输入框的状态
        this.inputStatus = false
      }
      // 输入删除成功查询内容重置到第一页
      if (this.deleteFlag === true) {
        this.queryInfo.pagenum = 1
        // 重置输入框的状态
        this.deleteFlag = false
      }
      const { data: res } = await this.$http.get('users', { params: this.queryInfo })
      if (res.meta.status !== 200) { return this.$message.error('获取用户列表失败') }
      this.userList = res.data.users
      this.total = res.data.total
    },
    // 监听pageSize改变的事件
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize
      // 重新调用
      this.getUserList()
    },
    // 监听页码值改变的事件
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage
      this.getUserList()
    },
    // 监听switch开关的改变
    async userStateChange(userInfo) {
      const { data: res } = await this.$http.put(`users/${userInfo.id}/state/{userInfo.mg_state}`)
      if (res.meta.status !== 200) {
        userInfo.mg_state = !userInfo.mg_state
        return this.$message.error('更新用户状态失败')
      }
      this.$message.success('更新用户状态成功')
    },
    // 监听输入框改变
    getInputChange() {
      this.inputStatus = true
    },
    // 监听添加用户对话框的关闭事件
    addDialogClose() {
      this.$refs.addFormRef.resetFields()
    },
    // 添加用户
    addUser() {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) return
        // 发起添加用户的网络请求
        const { data: res } = await this.$http.post('users', this.addForm)
        if (res.meta.status !== 201) {
          this.$message.error('添加用户失败')
        } else {
          this.$message.success('添加用户成功')
          // 隐藏添加用户对话框
          this.addDialogVisible = false
          // 刷新列表，重新获取用户列表数据
          this.getUserList()
        }
      })
    },
    // 获取用户信息并刷新ditForm的值
    async getUserInfo(id) {
      const { data: res } = await this.$http.get('/users/' + id)
      if (res.meta.status !== 200) { return this.$message.error('查询用户信息失败') }
      this.editForm = res.data
    },
    // 展示修改用户对话框
    showEditDialog(id) {
      this.getUserInfo(id)
      this.updateDialogVisible = true
    },
    // 监听修改用户对话框的关闭事件
    async editDialogClosed() {
      this.$refs.editFormRef.resetFields()
    },
    // 修改用户表单信息并提交
    editUserInfo() {
      this.$refs.editFormRef.validate(async valid => {
        if (!valid) { return }
        // 发起修改用户的数据请求
        const { data: res } = await this.$http.put('users/' + this.editForm.id,
          {
            email: this.editForm.email,
            mobile: this.editForm.mobile
          })
        if (res.meta.status !== 200) {
          return this.$message.error('更新用户信息失败')
        } else {
          this.getUserInfo(this.editForm.id)
          // 关闭对话框
          this.updateDialogVisible = false
          // 刷新数据列表
          this.getUserList()
          // 提示修改成功
          this.$message.success('更新成功')
        }
      })
    },
    // 根据id删除对应的用户信息
    async removeUserById(id) {
      // 弹框询问用户是否删除数据
      // 如果用户确认删除，返回值为字符串confirm
      // 如果用户取消删除，返回值字符串为cancel
      const confirmResult = await this.$confirm('此操作将永久删除该用户, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).catch(err => err)
      if (confirmResult === 'cancel') {
        return this.$message.info('已取消删除')
      } else {
        const { data: res } = await this.$http.delete('users/' + id)
        if (res.meta.status !== 200) {
          return this.$message.error('删除用户失败')
        } else {
          this.$message.success('删除用户成功')
          this.deleteFlag = true
          this.getUserList()
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>

</style>
